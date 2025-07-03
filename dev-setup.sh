#!/bin/bash

# ANDI Development Environment Setup Script
# Prepares the development environment for ANDI application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Utility functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup banner
cat << 'EOF'
     _    _   _ ____ ___ 
    / \  | \ | |  _ \_ _|
   / _ \ |  \| | | | | | 
  / ___ \| |\  | |_| | | 
 /_/   \_\_| \_|____/___|
                        
 Development Environment Setup
 
EOF

log "🚀 Setting up ANDI development environment..."

# Check prerequisites
log "🔍 Checking prerequisites..."

# Check for Docker
if command_exists docker; then
    success "Docker is installed"
    docker --version
else
    error "Docker is not installed"
    info "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    success "Docker Compose is available"
else
    error "Docker Compose is not installed"
    info "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check for Node.js
if command_exists node; then
    success "Node.js is installed"
    node --version
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        warning "Node.js version 18+ is recommended. Current version: $(node -v)"
        info "Consider upgrading: https://nodejs.org/"
    fi
else
    warning "Node.js is not installed"
    info "Install Node.js from: https://nodejs.org/ (version 18+ recommended)"
fi

# Check for npm/yarn
if command_exists npm; then
    success "npm is installed"
    npm --version
elif command_exists yarn; then
    success "yarn is installed"
    yarn --version
else
    warning "No package manager found (npm/yarn)"
fi

# Check for Make
if command_exists make; then
    success "Make is installed"
else
    warning "Make is not installed"
    info "Install Make for easier development commands"
fi

# Check for Git
if command_exists git; then
    success "Git is installed"
else
    warning "Git is not installed"
    info "Install Git from: https://git-scm.com/"
fi

# Check for PostgreSQL client (optional)
if command_exists psql; then
    success "PostgreSQL client is installed"
else
    info "PostgreSQL client not found (optional for direct database access)"
    info "Install with: brew install postgresql (macOS) or apt-get install postgresql-client (Ubuntu)"
fi

echo

# Setup environment files
log "📝 Setting up environment configuration..."

# Main environment file
if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    success "Created main .env file from template"
    warning "Please review and update .env with your configuration"
else
    info "Main .env file already exists"
fi

# Database environment file
if [[ ! -f "$SCRIPT_DIR/app/app-database/.env" ]]; then
    cd "$SCRIPT_DIR/app/app-database"
    if [[ -f ".env.example" ]]; then
        cp ".env.example" ".env"
        success "Created database .env file from template"
    fi
    cd "$SCRIPT_DIR"
else
    info "Database .env file already exists"
fi

# Create development directories
log "📁 Creating development directories..."

mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/.pids"
mkdir -p "$SCRIPT_DIR/temp"

success "Development directories created"

# Setup Git hooks (if in a Git repository)
if [[ -d "$SCRIPT_DIR/.git" ]]; then
    log "🔗 Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > "$SCRIPT_DIR/.git/hooks/pre-commit" << 'EOL'
#!/bin/bash
# ANDI pre-commit hook

echo "Running pre-commit checks..."

# Check for large files
large_files=$(git diff --cached --name-only | xargs ls -la 2>/dev/null | awk '$5 > 10485760 {print $9}')
if [[ -n "$large_files" ]]; then
    echo "Error: Large files detected (>10MB):"
    echo "$large_files"
    echo "Consider using Git LFS or .gitignore"
    exit 1
fi

# Check for secrets in .env files
if git diff --cached --name-only | grep -E '\.(env|env\.local|env\.production)$'; then
    echo "Warning: Environment files detected in commit"
    echo "Make sure no secrets are committed"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Pre-commit checks passed"
EOL
    
    chmod +x "$SCRIPT_DIR/.git/hooks/pre-commit"
    success "Git pre-commit hook installed"
fi

# Make scripts executable
log "🔧 Making scripts executable..."

chmod +x "$SCRIPT_DIR/start-andi.sh"
chmod +x "$SCRIPT_DIR/stop-andi.sh"
chmod +x "$SCRIPT_DIR/dev-setup.sh"

if [[ -f "$SCRIPT_DIR/app/app-database/scripts/backup.sh" ]]; then
    chmod +x "$SCRIPT_DIR/app/app-database/scripts/"*.sh
fi

if [[ -f "$SCRIPT_DIR/app/app-database/azure/deploy.sh" ]]; then
    chmod +x "$SCRIPT_DIR/app/app-database/azure/deploy.sh"
fi

success "Scripts made executable"

# Install database dependencies (if package.json exists)
if [[ -f "$SCRIPT_DIR/app/app-database/lib/package.json" ]]; then
    log "📦 Installing database dependencies..."
    cd "$SCRIPT_DIR/app/app-database/lib"
    
    if command_exists npm; then
        npm install
    elif command_exists yarn; then
        yarn install
    else
        warning "No package manager found, skipping dependency installation"
    fi
    
    cd "$SCRIPT_DIR"
    success "Database dependencies installed"
fi

# Test database setup
log "🧪 Testing database setup..."

cd "$SCRIPT_DIR/app/app-database"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running"
    info "Please start Docker and run this script again"
    exit 1
fi

# Quick database test
if make test-connection >/dev/null 2>&1; then
    success "Database is already running and accessible"
else
    info "Database not running (this is normal for first setup)"
fi

cd "$SCRIPT_DIR"

# Create useful aliases file
log "📋 Creating development aliases..."

cat > "$SCRIPT_DIR/dev-aliases.sh" << 'EOL'
#!/bin/bash
# ANDI Development Aliases
# Source this file in your shell: source dev-aliases.sh

# Application control
alias andi-start='./start-andi.sh'
alias andi-stop='./stop-andi.sh'
alias andi-restart='./stop-andi.sh && ./start-andi.sh'
alias andi-logs='tail -f logs/*.log'

# Database shortcuts
alias andi-db='cd app/app-database && make psql'
alias andi-db-health='cd app/app-database && make health-check'
alias andi-db-backup='cd app/app-database && make backup'
alias andi-db-restart='cd app/app-database && make restart'

# Development helpers
alias andi-clean='./stop-andi.sh && docker system prune -f'
alias andi-reset='cd app/app-database && make reset'

echo "ANDI development aliases loaded!"
echo "Available commands:"
echo "  andi-start, andi-stop, andi-restart"
echo "  andi-db, andi-db-health, andi-db-backup"
echo "  andi-logs, andi-clean, andi-reset"
EOL

success "Development aliases created (source dev-aliases.sh to use)"

# Create VS Code settings (if VS Code is detected)
if command_exists code; then
    log "🔧 Setting up VS Code configuration..."
    
    mkdir -p "$SCRIPT_DIR/.vscode"
    
    cat > "$SCRIPT_DIR/.vscode/settings.json" << 'EOL'
{
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.exclude": {
        "**/node_modules": true,
        "**/.next": true,
        "**/dist": true,
        "**/logs": true,
        "**/.pids": true
    },
    "sql.connections": [
        {
            "name": "ANDI Local Database",
            "server": "localhost",
            "database": "andi_db",
            "user": "andi_user",
            "port": 5432,
            "authenticationType": "SqlLogin"
        }
    ]
}
EOL

    cat > "$SCRIPT_DIR/.vscode/extensions.json" << 'EOL'
{
    "recommendations": [
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-json",
        "ms-mssql.mssql",
        "ms-vscode.vscode-docker",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint"
    ]
}
EOL

    success "VS Code configuration created"
fi

# Summary
echo
log "🎉 Development environment setup completed!"
echo
info "📊 Setup Summary:"
echo "─────────────────────────────────────"
success "Environment files configured"
success "Development directories created"
success "Scripts made executable"
success "Development aliases created"

if [[ -d "$SCRIPT_DIR/.git" ]]; then
    success "Git hooks installed"
fi

if command_exists code; then
    success "VS Code configuration created"
fi

echo "─────────────────────────────────────"
echo
info "🚀 Next Steps:"
echo "1. Review and update .env files with your configuration"
echo "2. Start the application: ./start-andi.sh"
echo "3. Access PgAdmin: http://localhost:5050"
echo "4. Source aliases: source dev-aliases.sh"
echo
info "💡 Useful Commands:"
echo "   Start ANDI:        ./start-andi.sh"
echo "   Stop ANDI:         ./stop-andi.sh"
echo "   Database CLI:      cd app/app-database && make psql"
echo "   View logs:         tail -f logs/*.log"
echo "   Clean restart:     ./start-andi.sh --clean"
echo
success "🎯 Ready to start developing with ANDI!"