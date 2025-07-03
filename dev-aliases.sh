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
