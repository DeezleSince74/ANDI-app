@description('Azure PostgreSQL deployment for ANDI application')
param location string = resourceGroup().location
param environmentName string = 'dev'
param administratorLogin string
@secure()
param administratorLoginPassword string

@description('PostgreSQL server configuration')
param postgresqlVersion string = '16'
param skuName string = 'Standard_B2s'
param skuTier string = 'Burstable'
param storageSize int = 32768 // 32GB
param backupRetentionDays int = 7
param geoRedundantBackup string = 'Disabled'

@description('Database configuration')
param databaseName string = 'andi_db'
param charset string = 'UTF8'
param collation string = 'en_US.utf8'

@description('Network configuration')
param allowAzureIps bool = true
param allowedIpRanges array = []

@description('Monitoring configuration')
param enableDiagnostics bool = true
param logAnalyticsWorkspaceId string = ''

// PostgreSQL Flexible Server
resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: 'andi-postgres-${environmentName}'
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: postgresqlVersion
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: storageSize
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup
    }
    highAvailability: {
      mode: environmentName == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
    maintenanceWindow: {
      customWindow: 'Enabled'
      dayOfWeek: 0 // Sunday
      startHour: 2
      startMinute: 0
    }
  }
  tags: {
    Environment: environmentName
    Application: 'ANDI'
    Purpose: 'Database'
  }
}

// Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresqlServer
  name: databaseName
  properties: {
    charset: charset
    collation: collation
  }
}

// Firewall rules
resource firewallRuleAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = if (allowAzureIps) {
  parent: postgresqlServer
  name: 'AllowAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource firewallRules 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = [for (ipRange, index) in allowedIpRanges: {
  parent: postgresqlServer
  name: 'AllowedRange${index}'
  properties: {
    startIpAddress: ipRange.start
    endIpAddress: ipRange.end
  }
}]

// PostgreSQL Configuration
resource postgresqlConfig 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  parent: postgresqlServer
  name: 'shared_preload_libraries'
  properties: {
    value: 'pg_stat_statements'
    source: 'user-override'
  }
}

// Diagnostic settings
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableDiagnostics && !empty(logAnalyticsWorkspaceId)) {
  name: 'andi-postgres-diagnostics'
  scope: postgresqlServer
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// Outputs
output postgresqlServerName string = postgresqlServer.name
output postgresqlServerFqdn string = postgresqlServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
output connectionString string = 'postgresql://${administratorLogin}:${administratorLoginPassword}@${postgresqlServer.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'