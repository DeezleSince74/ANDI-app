#!/usr/bin/env node

/**
 * ANDI TypeScript Type Generator
 * Generates TypeScript types from PostgreSQL schema files
 * Usage: node scripts/generate-types.js [--output path] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Configuration
const SCRIPT_DIR = __dirname;
const APP_DB_DIR = path.dirname(SCRIPT_DIR);
const PROJECT_ROOT = path.dirname(APP_DB_DIR);
const WEB_APP_DB_DIR = path.join(PROJECT_ROOT, 'web-app/src/db');
const DEFAULT_OUTPUT = path.join(WEB_APP_DB_DIR, 'types.ts');

// Command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const outputIndex = args.indexOf('--output');
const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : DEFAULT_OUTPUT;

console.log(`${colors.blue}🔧 ANDI TypeScript Type Generator${colors.reset}`);
console.log(`${colors.blue}===================================${colors.reset}\n`);

if (dryRun) {
    console.log(`${colors.yellow}🔍 DRY RUN MODE - No files will be modified${colors.reset}\n`);
}

// PostgreSQL to TypeScript type mapping
const TYPE_MAPPING = {
    // String types
    'VARCHAR': 'string',
    'TEXT': 'string',
    'CHAR': 'string',
    'UUID': 'string',
    
    // Number types
    'INTEGER': 'number',
    'BIGINT': 'number',
    'DECIMAL': 'number',
    'NUMERIC': 'number',
    'REAL': 'number',
    'DOUBLE PRECISION': 'number',
    'SERIAL': 'number',
    'BIGSERIAL': 'number',
    
    // Boolean type
    'BOOLEAN': 'boolean',
    
    // Date/Time types
    'TIMESTAMP': 'Date',
    'TIMESTAMPTZ': 'Date',
    'TIMESTAMP WITH TIME ZONE': 'Date',
    'DATE': 'Date',
    'TIME': 'string',
    
    // JSON types
    'JSON': 'Record<string, any>',
    'JSONB': 'Record<string, any>',
    
    // Array types
    'TEXT[]': 'string[]',
    'VARCHAR[]': 'string[]',
    'INTEGER[]': 'number[]',
};

// Function to parse PostgreSQL schema files
function parseSchemaFiles() {
    const initDir = path.join(APP_DB_DIR, 'init');
    if (!fs.existsSync(initDir)) {
        console.error(`${colors.red}❌ Error: init directory not found: ${initDir}${colors.reset}`);
        process.exit(1);
    }
    
    const schemaFiles = fs.readdirSync(initDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    
    console.log(`${colors.blue}📁 Analyzing ${schemaFiles.length} schema files...${colors.reset}`);
    
    let allSql = '';
    for (const file of schemaFiles) {
        const filePath = path.join(initDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        allSql += `\n-- File: ${file}\n${content}\n`;
        console.log(`  📄 ${file}`);
    }
    
    return allSql;
}

// Function to extract enum types from SQL
function extractEnums(sql) {
    const enums = {};
    
    // Match CREATE TYPE ... AS ENUM patterns
    const enumRegex = /CREATE TYPE\s+(\w+)\s+AS\s+ENUM\s*\(\s*([^)]+)\s*\)/gi;
    let match;
    
    while ((match = enumRegex.exec(sql)) !== null) {
        const enumName = match[1];
        const values = match[2]
            .split(',')
            .map(v => v.trim().replace(/['"]/g, ''))
            .filter(v => v.length > 0);
        
        enums[enumName] = values;
    }
    
    // Also extract from DO blocks (our enhanced enum creation)
    const doBlockRegex = /CREATE TYPE\s+(\w+)\s+AS\s+ENUM\s*\(\s*([^)]+)\s*\)/gi;
    const doBlocks = sql.match(/DO \$\$[^$]+\$\$/gi) || [];
    
    for (const block of doBlocks) {
        let enumMatch;
        while ((enumMatch = doBlockRegex.exec(block)) !== null) {
            const enumName = enumMatch[1];
            const values = enumMatch[2]
                .split(',')
                .map(v => v.trim().replace(/['"]/g, ''))
                .filter(v => v.length > 0);
            
            enums[enumName] = values;
        }
    }
    
    return enums;
}

// Function to extract table definitions from SQL
function extractTables(sql) {
    const tables = {};
    
    // Match CREATE TABLE patterns
    const tableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:(\w+)\.)?(\w+)\s*\(\s*([^;]+?)\s*\);/gis;
    let match;
    
    while ((match = tableRegex.exec(sql)) !== null) {
        const schema = match[1] || 'public';
        const tableName = match[2];
        const columnsStr = match[3];
        
        // Parse columns
        const columns = parseColumns(columnsStr);
        
        if (!tables[schema]) {
            tables[schema] = {};
        }
        
        tables[schema][tableName] = {
            columns,
            fullName: schema !== 'public' ? `${schema}.${tableName}` : tableName
        };
    }
    
    return tables;
}

// Function to parse column definitions
function parseColumns(columnsStr) {
    const columns = [];
    
    // Split by commas, but handle nested parentheses
    const lines = columnsStr.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
        // Skip constraints and other non-column definitions
        if (line.toUpperCase().includes('CONSTRAINT') || 
            line.toUpperCase().includes('PRIMARY KEY') ||
            line.toUpperCase().includes('FOREIGN KEY') ||
            line.toUpperCase().includes('CHECK') ||
            line.toUpperCase().includes('UNIQUE') ||
            line.toUpperCase().includes('INDEX') ||
            line.startsWith('--')) {
            continue;
        }
        
        // Parse column definition
        const columnMatch = line.match(/^(\w+)\s+([^,\s]+(?:\s*\([^)]*\))?)\s*(.*?)(?:,\s*)?$/i);
        if (columnMatch) {
            const columnName = columnMatch[1];
            const columnType = columnMatch[2].toUpperCase();
            const constraints = columnMatch[3] || '';
            
            const isNullable = !constraints.toUpperCase().includes('NOT NULL');
            const hasDefault = constraints.toUpperCase().includes('DEFAULT');
            
            columns.push({
                name: columnName,
                type: columnType,
                nullable: isNullable,
                hasDefault
            });
        }
    }
    
    return columns;
}

// Function to convert PostgreSQL type to TypeScript type
function pgTypeToTsType(pgType, enums) {
    // Handle array types
    if (pgType.endsWith('[]')) {
        const baseType = pgType.slice(0, -2);
        return `${pgTypeToTsType(baseType, enums)}[]`;
    }
    
    // Handle varchar with length
    if (pgType.startsWith('VARCHAR')) {
        return 'string';
    }
    
    // Check if it's an enum type
    if (enums[pgType.toLowerCase()]) {
        return toCamelCase(pgType);
    }
    
    // Use mapping
    return TYPE_MAPPING[pgType] || 'any';
}

// Utility functions
function toCamelCase(str) {
    return str.split('_')
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function toPascalCase(str) {
    return str.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

// Function to generate TypeScript interfaces
function generateTypeScript(enums, tables) {
    let output = `/**
 * ANDI Database Types - Auto-Generated
 * Generated from app-database schemas on ${new Date().toISOString()}
 * 
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Source: app-database/init/*.sql
 * Generator: app-database/scripts/generate-types.js
 */

// =============================================================================
// ENUM TYPES (from PostgreSQL ENUMs)
// =============================================================================

`;

    // Generate enum types
    for (const [enumName, values] of Object.entries(enums)) {
        const tsEnumName = toPascalCase(enumName);
        const enumValues = values.map(v => `'${v}'`).join(' | ');
        output += `export type ${tsEnumName} = ${enumValues};\n`;
    }
    
    output += `\n// =============================================================================
// TABLE INTERFACE TYPES
// =============================================================================

`;

    // Generate table interfaces
    for (const [schema, schemaTables] of Object.entries(tables)) {
        output += `// ${schema.toUpperCase()} SCHEMA\n`;
        
        for (const [tableName, tableInfo] of Object.entries(schemaTables)) {
            const interfaceName = toPascalCase(tableName);
            
            output += `export interface ${interfaceName} {\n`;
            
            for (const column of tableInfo.columns) {
                const tsType = pgTypeToTsType(column.type, enums);
                const optional = column.nullable || column.hasDefault ? '?' : '';
                const fieldName = toCamelCase(column.name);
                
                output += `  ${fieldName}${optional}: ${tsType};\n`;
            }
            
            output += `}\n\n`;
            
            // Generate Create/Update types
            output += `export interface Create${interfaceName} {\n`;
            for (const column of tableInfo.columns) {
                // Skip auto-generated fields for create types
                if (column.name === 'id' || 
                    column.name === 'created_at' || 
                    column.name === 'updated_at') {
                    continue;
                }
                
                const tsType = pgTypeToTsType(column.type, enums);
                const optional = column.nullable || column.hasDefault ? '?' : '';
                const fieldName = toCamelCase(column.name);
                
                output += `  ${fieldName}${optional}: ${tsType};\n`;
            }
            output += `}\n\n`;
            
            output += `export interface Update${interfaceName} {\n`;
            for (const column of tableInfo.columns) {
                // Skip ID fields for update types
                if (column.name === 'id') {
                    continue;
                }
                
                const tsType = pgTypeToTsType(column.type, enums);
                const fieldName = toCamelCase(column.name);
                
                output += `  ${fieldName}?: ${tsType};\n`;
            }
            output += `}\n\n`;
        }
        
        output += '\n';
    }
    
    // Add utility types
    output += `// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface DatabaseRecord {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string | Date;
  version?: string;
  pool_total?: number;
  pool_idle?: number;
  pool_waiting?: number;
  error?: string;
}

export interface DatabaseStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  isConnected: boolean;
}
`;

    return output;
}

// Main execution
async function main() {
    try {
        console.log(`${colors.blue}📋 Parsing schema files...${colors.reset}`);
        const sql = parseSchemaFiles();
        
        console.log(`${colors.blue}🔍 Extracting enums...${colors.reset}`);
        const enums = extractEnums(sql);
        console.log(`  Found ${Object.keys(enums).length} enum types`);
        
        console.log(`${colors.blue}🔍 Extracting tables...${colors.reset}`);
        const tables = extractTables(sql);
        const totalTables = Object.values(tables).reduce((sum, schema) => sum + Object.keys(schema).length, 0);
        console.log(`  Found ${totalTables} tables across ${Object.keys(tables).length} schemas`);
        
        console.log(`${colors.blue}⚙️  Generating TypeScript types...${colors.reset}`);
        const typeScript = generateTypeScript(enums, tables);
        
        if (dryRun) {
            console.log(`${colors.yellow}[DRY RUN] Would write ${typeScript.length} characters to: ${outputFile}${colors.reset}`);
            console.log(`${colors.blue}📊 Generated types preview:${colors.reset}`);
            console.log(typeScript.substring(0, 500) + '...');
        } else {
            // Ensure output directory exists
            const outputDir = path.dirname(outputFile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Create backup of existing file
            if (fs.existsSync(outputFile)) {
                const backupFile = `${outputFile}.backup.${Date.now()}`;
                fs.copyFileSync(outputFile, backupFile);
                console.log(`${colors.yellow}📋 Backup created: ${backupFile}${colors.reset}`);
            }
            
            // Write the generated types
            fs.writeFileSync(outputFile, typeScript);
            console.log(`${colors.green}✅ TypeScript types generated: ${outputFile}${colors.reset}`);
            console.log(`${colors.green}📊 Generated ${typeScript.length} characters with ${Object.keys(enums).length} enums and ${totalTables} table interfaces${colors.reset}`);
        }
        
    } catch (error) {
        console.error(`${colors.red}❌ Error generating types: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run the generator
main();