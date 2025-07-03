@description('Azure ClickHouse deployment for ANDI data warehouse')
param location string = resourceGroup().location
param environmentName string = 'dev'
param administratorLogin string
@secure()
param administratorLoginPassword string

@description('ClickHouse cluster configuration')
param clusterName string = 'andi-clickhouse-${environmentName}'
param nodeCount int = environmentName == 'prod' ? 3 : 1
param nodeSize string = environmentName == 'prod' ? 'Standard_D4s_v3' : 'Standard_D2s_v3'
param diskSize int = environmentName == 'prod' ? 512 : 128 // GB

@description('Network configuration')
param vnetName string = 'andi-vnet-${environmentName}'
param subnetName string = 'andi-clickhouse-subnet'
param allowedIpRanges array = []

@description('Storage configuration')
param storageAccountName string = 'andiclickhouse${environmentName}'
param storageSkuName string = 'Standard_LRS'

@description('Monitoring configuration')
param enableDiagnostics bool = true
param logAnalyticsWorkspaceId string = ''

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.0.1.0/24'
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
    Purpose: 'DataWarehouse'
  }
}

// Storage Account for ClickHouse data
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
      defaultAction: 'Deny'
      virtualNetworkRules: [
        {
          id: vnet.properties.subnets[0].id
          action: 'Allow'
        }
      ]
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataWarehouse'
  }
}

// Container for ClickHouse data
resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/clickhouse-data'
  properties: {
    publicAccess: 'None'
  }
}

// Azure Container Instances for ClickHouse
resource clickhouseContainerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: clusterName
  location: location
  properties: {
    containers: [
      {
        name: 'clickhouse'
        properties: {
          image: 'clickhouse/clickhouse-server:23.12'
          resources: {
            requests: {
              cpu: 2
              memoryInGB: 8
            }
            limits: {
              cpu: 4
              memoryInGB: 16
            }
          }
          ports: [
            {
              port: 8123
              protocol: 'TCP'
            }
            {
              port: 9000
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'CLICKHOUSE_DB'
              value: 'andi_warehouse'
            }
            {
              name: 'CLICKHOUSE_USER'
              value: administratorLogin
            }
            {
              name: 'CLICKHOUSE_PASSWORD'
              secureValue: administratorLoginPassword
            }
            {
              name: 'CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT'
              value: '1'
            }
          ]
          volumeMounts: [
            {
              name: 'clickhouse-data'
              mountPath: '/var/lib/clickhouse'
            }
            {
              name: 'clickhouse-logs'
              mountPath: '/var/log/clickhouse-server'
            }
          ]
        }
      }
      {
        name: 'grafana'
        properties: {
          image: 'grafana/grafana:10.2.3'
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 2
            }
            limits: {
              cpu: 2
              memoryInGB: 4
            }
          }
          ports: [
            {
              port: 3000
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'GF_SECURITY_ADMIN_PASSWORD'
              secureValue: administratorLoginPassword
            }
            {
              name: 'GF_USERS_ALLOW_SIGN_UP'
              value: 'false'
            }
            {
              name: 'GF_INSTALL_PLUGINS'
              value: 'grafana-clickhouse-datasource'
            }
          ]
          volumeMounts: [
            {
              name: 'grafana-storage'
              mountPath: '/var/lib/grafana'
            }
          ]
        }
      }
      {
        name: 'prometheus'
        properties: {
          image: 'prom/prometheus:v2.48.1'
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 2
            }
            limits: {
              cpu: 2
              memoryInGB: 4
            }
          }
          ports: [
            {
              port: 9090
              protocol: 'TCP'
            }
          ]
          volumeMounts: [
            {
              name: 'prometheus-data'
              mountPath: '/prometheus'
            }
          ]
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Always'
    ipAddress: {
      type: 'Public'
      ports: [
        {
          port: 8123
          protocol: 'TCP'
        }
        {
          port: 3000
          protocol: 'TCP'
        }
        {
          port: 9090
          protocol: 'TCP'
        }
      ]
    }
    volumes: [
      {
        name: 'clickhouse-data'
        azureFile: {
          shareName: 'clickhouse-data'
          storageAccountName: storageAccount.name
          storageAccountKey: storageAccount.listKeys().keys[0].value
        }
      }
      {
        name: 'clickhouse-logs'
        azureFile: {
          shareName: 'clickhouse-logs'
          storageAccountName: storageAccount.name
          storageAccountKey: storageAccount.listKeys().keys[0].value
        }
      }
      {
        name: 'grafana-storage'
        azureFile: {
          shareName: 'grafana-storage'
          storageAccountName: storageAccount.name
          storageAccountKey: storageAccount.listKeys().keys[0].value
        }
      }
      {
        name: 'prometheus-data'
        azureFile: {
          shareName: 'prometheus-data'
          storageAccountName: storageAccount.name
          storageAccountKey: storageAccount.listKeys().keys[0].value
        }
      }
    ]
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataWarehouse'
  }
}

// File shares for persistent storage
resource fileShares 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-01-01' = [for shareName in ['clickhouse-data', 'clickhouse-logs', 'grafana-storage', 'prometheus-data']: {
  name: '${storageAccount.name}/default/${shareName}'
  properties: {
    shareQuota: 100
  }
}]

// Network Security Group for ClickHouse
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${clusterName}-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowClickHouseHTTP'
        properties: {
          priority: 1000
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '8123'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowClickHouseNative'
        properties: {
          priority: 1001
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '9000'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowGrafana'
        properties: {
          priority: 1002
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '3000'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowPrometheus'
        properties: {
          priority: 1003
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '9090'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'DataWarehouse'
  }
}

// Outputs
output clickhouseEndpoint string = 'http://${clickhouseContainerGroup.properties.ipAddress.ip}:8123'
output grafanaEndpoint string = 'http://${clickhouseContainerGroup.properties.ipAddress.ip}:3000'
output prometheusEndpoint string = 'http://${clickhouseContainerGroup.properties.ipAddress.ip}:9090'
output storageAccountName string = storageAccount.name
output containerGroupName string = clickhouseContainerGroup.name