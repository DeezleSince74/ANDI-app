@description('Azure Langflow deployment for ANDI AI workflows')
param location string = resourceGroup().location
param environmentName string = 'dev'
param administratorLogin string
@secure()
param administratorLoginPassword string

@description('Langflow configuration')
param langflowVersion string = 'latest'
param langflowMode string = environmentName == 'prod' ? 'runtime' : 'ide'
param workerCount int = environmentName == 'prod' ? 4 : 2
param workerTimeout int = environmentName == 'prod' ? 600 : 300

@description('Network configuration')
param vnetName string = 'andi-vnet-${environmentName}'
param subnetName string = 'andi-langflow-subnet'

@description('Storage configuration')
param storageAccountName string = 'andilangflow${environmentName}'
param storageSkuName string = 'Standard_LRS'

@description('Database configuration')
param langflowDatabaseName string = 'langflow_db'
param postgresqlServerName string = 'andi-postgres-${environmentName}'

@description('Container Apps Environment')
param containerAppsEnvironmentName string = 'andi-langflow-env-${environmentName}'

@description('Redis configuration')
param redisName string = 'andi-langflow-redis-${environmentName}'
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
    Purpose: 'Langflow'
  }
}

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.2.0.0/16'
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.2.1.0/24'
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
    Purpose: 'Langflow'
  }
}

// Storage Account for Langflow flows and data
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
    Purpose: 'Langflow'
  }
}

// File shares for Langflow
resource fileShares 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-01-01' = [for shareName in ['langflow-data', 'langflow-flows', 'langflow-components', 'langflow-logs']: {
  name: '${storageAccount.name}/default/${shareName}'
  properties: {
    shareQuota: 100
  }
}]

// Redis Cache for Langflow caching
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
    Purpose: 'Langflow'
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
    Purpose: 'Langflow'
  }
}

// Langflow Container App
resource langflowApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'andi-langflow-${environmentName}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 7860
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
          name: 'langflow-secret-key'
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
          name: 'langflow'
          image: 'langflowai/langflow:${langflowVersion}'
          resources: {
            cpu: json(environmentName == 'prod' ? '2.0' : '1.0')
            memory: environmentName == 'prod' ? '4Gi' : '2Gi'
          }
          env: [
            {
              name: 'LANGFLOW_DATABASE_URL'
              value: 'postgresql://${administratorLogin}:${administratorLoginPassword}@${postgresqlServerName}.postgres.database.azure.com:5432/${langflowDatabaseName}'
            }
            {
              name: 'LANGFLOW_CONFIG_DIR'
              value: '/app/langflow'
            }
            {
              name: 'LANGFLOW_SECRET_KEY'
              secretRef: 'langflow-secret-key'
            }
            {
              name: 'LANGFLOW_BACKEND_ONLY'
              value: langflowMode == 'runtime' ? 'true' : 'false'
            }
            {
              name: 'LANGFLOW_AUTO_LOGIN'
              value: environmentName == 'dev' ? 'true' : 'false'
            }
            {
              name: 'LANGFLOW_DEV'
              value: environmentName == 'dev' ? 'true' : 'false'
            }
            {
              name: 'LANGFLOW_LOG_LEVEL'
              value: environmentName == 'prod' ? 'warning' : 'info'
            }
            {
              name: 'LANGFLOW_WORKERS'
              value: string(workerCount)
            }
            {
              name: 'LANGFLOW_WORKER_TIMEOUT'
              value: string(workerTimeout)
            }
            {
              name: 'LANGFLOW_CACHE_TYPE'
              value: 'redis'
            }
            {
              name: 'LANGFLOW_REDIS_URL'
              value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:6380/0'
            }
            {
              name: 'LANGFLOW_SUPERUSER_EMAIL'
              value: administratorLogin
            }
            {
              name: 'LANGFLOW_SUPERUSER_PASSWORD'
              secretRef: 'postgres-password'
            }
            {
              name: 'ANDI_DATABASE_URL'
              value: 'postgresql://${administratorLogin}:${administratorLoginPassword}@${postgresqlServerName}.postgres.database.azure.com:5432/andi_db'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: storageAccount.name
            }
            {
              name: 'AZURE_STORAGE_KEY'
              secretRef: 'storage-key'
            }
            {
              name: 'SENTRY_DSN'
              value: ''
            }
            {
              name: 'SENTRY_ENVIRONMENT'
              value: environmentName
            }
          ]
          volumeMounts: [
            {
              volumeName: 'langflow-data-volume'
              mountPath: '/app/langflow'
            }
            {
              volumeName: 'langflow-flows-volume'
              mountPath: '/app/flows'
            }
            {
              volumeName: 'langflow-components-volume'
              mountPath: '/app/custom_components'
            }
          ]
        }
      ]
      scale: {
        minReplicas: environmentName == 'prod' ? 2 : 1
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
          {
            name: 'memory-scaling'
            custom: {
              type: 'memory'
              metadata: {
                type: 'Utilization'
                value: '80'
              }
            }
          }
        ]
      }
      volumes: [
        {
          name: 'langflow-data-volume'
          storageType: 'AzureFile'
          storageName: 'langflow-data-storage'
        }
        {
          name: 'langflow-flows-volume'
          storageType: 'AzureFile'
          storageName: 'langflow-flows-storage'
        }
        {
          name: 'langflow-components-volume'
          storageType: 'AzureFile'
          storageName: 'langflow-components-storage'
        }
      ]
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'Langflow'
  }
  dependsOn: [
    dataStorage
    flowsStorage
    componentsStorage
  ]
}

// Storage for Container Apps
resource dataStorage 'Microsoft.App/managedEnvironments/storages@2023-05-01' = {
  name: 'langflow-data-storage'
  parent: containerAppsEnvironment
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: 'langflow-data'
      accessMode: 'ReadWrite'
    }
  }
}

resource flowsStorage 'Microsoft.App/managedEnvironments/storages@2023-05-01' = {
  name: 'langflow-flows-storage'
  parent: containerAppsEnvironment
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: 'langflow-flows'
      accessMode: 'ReadWrite'
    }
  }
}

resource componentsStorage 'Microsoft.App/managedEnvironments/storages@2023-05-01' = {
  name: 'langflow-components-storage'
  parent: containerAppsEnvironment
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: 'langflow-components'
      accessMode: 'ReadWrite'
    }
  }
}

// Outputs
output langflowUrl string = 'https://${langflowApp.properties.configuration.ingress.fqdn}'
output storageAccountName string = storageAccount.name
output redisHostname string = redisCache.properties.hostName
output containerAppsEnvironmentName string = containerAppsEnvironment.name
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name
output langflowDatabaseName string = langflowDatabaseName