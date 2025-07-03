@description('Azure Airflow deployment for ANDI data pipelines')
param location string = resourceGroup().location
param environmentName string = 'dev'
param administratorLogin string
@secure()
param administratorLoginPassword string

@description('Airflow configuration')
param airflowVersion string = '2.7.3'
param webserverPort int = 8080
param schedulerReplicas int = environmentName == 'prod' ? 2 : 1
param workerReplicas int = environmentName == 'prod' ? 3 : 1

@description('Network configuration')
param vnetName string = 'andi-vnet-${environmentName}'
param subnetName string = 'andi-airflow-subnet'

@description('Storage configuration')
param storageAccountName string = 'andiairflow${environmentName}'
param storageSkuName string = 'Standard_LRS'

@description('Database configuration')
param postgresqlServerName string = 'andi-postgres-${environmentName}'
param airflowDatabaseName string = 'airflow_db'

@description('Container Apps Environment')
param containerAppsEnvironmentName string = 'andi-airflow-env-${environmentName}'

@description('Redis configuration for Celery')
param redisName string = 'andi-redis-${environmentName}'
param redisSku string = environmentName == 'prod' ? 'Premium' : 'Basic'
param redisCapacity int = environmentName == 'prod' ? 1 : 0

@description('Monitoring configuration')
param logAnalyticsWorkspaceName string = 'andi-logs-${environmentName}'

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.1.0.0/16'
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.1.1.0/24'
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
            }
          ]
        }
      }
    ]
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Storage Account for Airflow logs and DAGs
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSkuName
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Allow' // Allow for Container Apps access
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// File shares for Airflow
resource fileShares 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-01-01' = [for shareName in ['airflow-dags', 'airflow-logs', 'airflow-plugins']: {
  name: '${storageAccount.name}/default/${shareName}'
  properties: {
    shareQuota: 100
  }
}]

// Redis Cache for Celery broker
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: redisSku
      family: redisSku == 'Premium' ? 'P' : 'C'
      capacity: redisCapacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvironmentName
  location: location
  properties: {
    vnetConfiguration: {
      internal: false
      infrastructureSubnetId: vnet.properties.subnets[0].id
    }
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Airflow Webserver Container App
resource airflowWebserver 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'andi-airflow-webserver-${environmentName}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: webserverPort
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'postgres-password'
          value: administratorLoginPassword
        }
        {
          name: 'redis-password'
          value: redisCache.listKeys().primaryKey
        }
        {
          name: 'airflow-fernet-key'
          value: base64(guid())
        }
        {
          name: 'storage-key'
          value: storageAccount.listKeys().keys[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'airflow-webserver'
          image: 'apache/airflow:${airflowVersion}-python3.10'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'AIRFLOW__CORE__EXECUTOR'
              value: 'CeleryExecutor'
            }
            {
              name: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN'
              value: 'postgresql://${administratorLogin}:${administratorLoginPassword}@${postgresqlServerName}.postgres.database.azure.com:5432/${airflowDatabaseName}'
            }
            {
              name: 'AIRFLOW__CELERY__BROKER_URL'
              value: 'redis://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
            }
            {
              name: 'AIRFLOW__CELERY__RESULT_BACKEND'
              value: 'redis://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
            }
            {
              name: 'AIRFLOW__CORE__FERNET_KEY'
              secretRef: 'airflow-fernet-key'
            }
            {
              name: 'AIRFLOW__WEBSERVER__SECRET_KEY'
              secretRef: 'airflow-fernet-key'
            }
            {
              name: 'AIRFLOW__CORE__DAGS_FOLDER'
              value: '/opt/airflow/dags'
            }
            {
              name: 'AIRFLOW__LOGGING__REMOTE_LOGGING'
              value: 'True'
            }
            {
              name: 'AIRFLOW__LOGGING__REMOTE_BASE_LOG_FOLDER'
              value: 'wasb-logs://airflow-logs@${storageAccount.name}.blob.core.windows.net/'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: storageAccount.name
            }
            {
              name: 'AZURE_STORAGE_KEY'
              secretRef: 'storage-key'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'dags-volume'
              mountPath: '/opt/airflow/dags'
            }
          ]
          command: [
            'bash'
            '-c'
            'airflow db init && airflow users create --username admin --password ${administratorLoginPassword} --firstname Admin --lastname User --role Admin --email admin@andi.com && airflow webserver'
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
      volumes: [
        {
          name: 'dags-volume'
          storageType: 'AzureFile'
          storageName: 'dags-storage'
        }
      ]
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Storage for Container Apps
resource dagsStorage 'Microsoft.App/managedEnvironments/storages@2023-05-01' = {
  name: 'dags-storage'
  parent: containerAppsEnvironment
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: 'airflow-dags'
      accessMode: 'ReadWrite'
    }
  }
}

// Airflow Scheduler Container App
resource airflowScheduler 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'andi-airflow-scheduler-${environmentName}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'postgres-password'
          value: administratorLoginPassword
        }
        {
          name: 'redis-password'
          value: redisCache.listKeys().primaryKey
        }
        {
          name: 'airflow-fernet-key'
          value: base64(guid())
        }
        {
          name: 'storage-key'
          value: storageAccount.listKeys().keys[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'airflow-scheduler'
          image: 'apache/airflow:${airflowVersion}-python3.10'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'AIRFLOW__CORE__EXECUTOR'
              value: 'CeleryExecutor'
            }
            {
              name: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN'
              value: 'postgresql://${administratorLogin}:${administratorLoginPassword}@${postgresqlServerName}.postgres.database.azure.com:5432/${airflowDatabaseName}'
            }
            {
              name: 'AIRFLOW__CELERY__BROKER_URL'
              value: 'redis://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
            }
            {
              name: 'AIRFLOW__CELERY__RESULT_BACKEND'
              value: 'redis://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
            }
            {
              name: 'AIRFLOW__CORE__FERNET_KEY'
              secretRef: 'airflow-fernet-key'
            }
            {
              name: 'AIRFLOW__CORE__DAGS_FOLDER'
              value: '/opt/airflow/dags'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: storageAccount.name
            }
            {
              name: 'AZURE_STORAGE_KEY'
              secretRef: 'storage-key'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'dags-volume'
              mountPath: '/opt/airflow/dags'
            }
          ]
          command: [
            'airflow'
            'scheduler'
          ]
        }
      ]
      scale: {
        minReplicas: schedulerReplicas
        maxReplicas: schedulerReplicas
      }
      volumes: [
        {
          name: 'dags-volume'
          storageType: 'AzureFile'
          storageName: 'dags-storage'
        }
      ]
    }
  }
  dependsOn: [
    dagsStorage
  ]
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Airflow Worker Container App
resource airflowWorker 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'andi-airflow-worker-${environmentName}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'postgres-password'
          value: administratorLoginPassword
        }
        {
          name: 'redis-password'
          value: redisCache.listKeys().primaryKey
        }
        {
          name: 'airflow-fernet-key'
          value: base64(guid())
        }
        {
          name: 'storage-key'
          value: storageAccount.listKeys().keys[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'airflow-worker'
          image: 'apache/airflow:${airflowVersion}-python3.10'
          resources: {
            cpu: json('2.0')
            memory: '4Gi'
          }
          env: [
            {
              name: 'AIRFLOW__CORE__EXECUTOR'
              value: 'CeleryExecutor'
            }
            {
              name: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN'
              value: 'postgresql://${administratorLogin}:${administratorLoginPassword}@${postgresqlServerName}.postgres.database.azure.com:5432/${airflowDatabaseName}'
            }
            {
              name: 'AIRFLOW__CELERY__BROKER_URL'
              value: 'redis://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
            }
            {
              name: 'AIRFLOW__CELERY__RESULT_BACKEND'
              value: 'redis://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0?ssl_cert_reqs=required'
            }
            {
              name: 'AIRFLOW__CORE__FERNET_KEY'
              secretRef: 'airflow-fernet-key'
            }
            {
              name: 'AIRFLOW__CORE__DAGS_FOLDER'
              value: '/opt/airflow/dags'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: storageAccount.name
            }
            {
              name: 'AZURE_STORAGE_KEY'
              secretRef: 'storage-key'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'dags-volume'
              mountPath: '/opt/airflow/dags'
            }
          ]
          command: [
            'airflow'
            'celery'
            'worker'
          ]
        }
      ]
      scale: {
        minReplicas: workerReplicas
        maxReplicas: environmentName == 'prod' ? 6 : 3
        rules: [
          {
            name: 'cpu-scaling'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
        ]
      }
      volumes: [
        {
          name: 'dags-volume'
          storageType: 'AzureFile'
          storageName: 'dags-storage'
        }
      ]
    }
  }
  dependsOn: [
    dagsStorage
  ]
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataPipelines'
  }
}

// Outputs
output airflowWebserverUrl string = 'https://${airflowWebserver.properties.configuration.ingress.fqdn}'
output storageAccountName string = storageAccount.name
output redisHostname string = redisCache.properties.hostName
output containerAppsEnvironmentName string = containerAppsEnvironment.name
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name