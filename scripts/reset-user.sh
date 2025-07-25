#!/bin/bash

# ANDI User Reset Script
# Removes a user and all associated data for testing purposes

set -e  # Exit on any error

# Default values
USER_EMAIL="derekfrempong@gmail.com"
DATABASE_CONTAINER="andi-postgres"
DATABASE_NAME="andi_db"
DATABASE_USER="andi_user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Reset a user by removing all their data from the ANDI database."
    echo ""
    echo "OPTIONS:"
    echo "  -e, --email EMAIL    User email address (default: derekfrempong@gmail.com)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                                    # Reset derekfrempong@gmail.com"
    echo "  $0 -e teacher@school.edu             # Reset specific user"
    echo "  $0 --email another@example.com       # Reset another user"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--email)
            USER_EMAIL="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate email format
if [[ ! "$USER_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    print_error "Invalid email format: $USER_EMAIL"
    exit 1
fi

print_status "🧹 ANDI User Reset Script"
print_status "User to reset: $USER_EMAIL"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "$DATABASE_CONTAINER"; then
    print_error "Database container '$DATABASE_CONTAINER' is not running."
    print_status "Please start the ANDI application first:"
    print_status "  ./start-andi.sh"
    exit 1
fi

# Function to execute SQL commands
execute_sql() {
    local sql_command="$1"
    docker exec "$DATABASE_CONTAINER" psql -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "$sql_command" 2>/dev/null
}

# Function to count records
count_records() {
    local table="$1"
    local condition="$2"
    local count=$(execute_sql "SELECT COUNT(*) FROM $table WHERE $condition;" | grep -E '^\s*[0-9]+\s*$' | tr -d ' ')
    echo "$count"
}

print_status "🔍 Checking current user data..."

# Get user ID first (using correct NextAuth table)
USER_ID=$(execute_sql "SELECT id FROM andi_web_user WHERE email = '$USER_EMAIL';" | grep -E '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1 | tr -d ' ')

if [ -z "$USER_ID" ]; then
    print_warning "User $USER_EMAIL not found in database."
    exit 0
fi

print_success "Found user: $USER_EMAIL (ID: $USER_ID)"

# Count existing records (using correct table names)
AUTH_USERS=$(count_records "andi_web_user" "email = '$USER_EMAIL'")
TEACHER_PROFILES=$(count_records "andi_web_teacher_profile" "user_id = '$USER_ID'")
ONBOARDING_PROGRESS=$(count_records "andi_web_onboarding_progress" "user_id = '$USER_ID'")
AUDIO_SESSIONS=$(count_records "core.audio_sessions" "teacher_id = '$USER_ID'")

echo ""
print_status "📊 Current data summary:"
echo "  • Auth users: $AUTH_USERS"
echo "  • Teacher profiles: $TEACHER_PROFILES" 
echo "  • Onboarding progress: $ONBOARDING_PROGRESS"
echo "  • Audio sessions: $AUDIO_SESSIONS"
echo ""

# Confirm deletion
read -p "$(echo -e ${YELLOW}⚠${NC}) Are you sure you want to delete all data for $USER_EMAIL? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Operation cancelled."
    exit 0
fi

print_status "🗑️ Starting user data deletion..."

# Delete in proper order to handle foreign key constraints
# Note: Many tables have CASCADE DELETE, so deleting the user should clean up most data

# 1. Delete onboarding progress (if exists)
if [ "$ONBOARDING_PROGRESS" -gt 0 ]; then
    print_status "Deleting onboarding progress..."
    DELETED=$(execute_sql "DELETE FROM andi_web_onboarding_progress WHERE user_id = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
    print_success "Deleted $DELETED onboarding progress records"
fi

# 2. Delete audio sessions (if exists) 
if [ "$AUDIO_SESSIONS" -gt 0 ]; then
    print_status "Deleting audio sessions..."
    DELETED=$(execute_sql "DELETE FROM core.audio_sessions WHERE teacher_id = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
    print_success "Deleted $DELETED audio session records"
fi

# 3. Delete teacher profile (CASCADE should handle related data)
if [ "$TEACHER_PROFILES" -gt 0 ]; then
    print_status "Deleting teacher profile..."
    DELETED=$(execute_sql "DELETE FROM andi_web_teacher_profile WHERE user_id = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
    print_success "Deleted $DELETED teacher profile records"
fi

# 4. Delete NextAuth accounts and sessions
print_status "Deleting user account and sessions..."
ACCOUNTS_DELETED=$(execute_sql "DELETE FROM andi_web_account WHERE \"userId\" = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
SESSIONS_DELETED=$(execute_sql "DELETE FROM andi_web_session WHERE \"userId\" = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
USER_SESSIONS_DELETED=$(execute_sql "DELETE FROM andi_web_user_session WHERE user_id = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)

print_success "Deleted $ACCOUNTS_DELETED account records"
print_success "Deleted $SESSIONS_DELETED session records"
print_success "Deleted $USER_SESSIONS_DELETED user session records"

# 5. Delete user preferences
PREFERENCES_DELETED=$(execute_sql "DELETE FROM andi_web_user_preference WHERE user_id = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
if [ "$PREFERENCES_DELETED" -gt 0 ]; then
    print_success "Deleted $PREFERENCES_DELETED user preference records"
fi

# 6. Delete main user record
USERS_DELETED=$(execute_sql "DELETE FROM andi_web_user WHERE id = '$USER_ID';" | grep "DELETE" | cut -d' ' -f2)
print_success "Deleted $USERS_DELETED user records"

# 7. Clean up any orphaned verification tokens
TOKENS_DELETED=$(execute_sql "DELETE FROM \"andi_web_verificationToken\" WHERE expires < NOW();" | grep "DELETE" | cut -d' ' -f2)
if [ "$TOKENS_DELETED" -gt 0 ]; then
    print_success "Cleaned up $TOKENS_DELETED expired verification tokens"
fi

echo ""
print_status "🧹 Cleanup completed successfully!"
print_success "User $USER_EMAIL has been completely removed from the system."
print_status "The user can now go through the onboarding process again."

echo ""
print_status "📋 Summary of deleted records:"
echo "  • User accounts: $USERS_DELETED"
echo "  • Auth accounts: $ACCOUNTS_DELETED"
echo "  • Sessions: $SESSIONS_DELETED"
echo "  • Teacher profiles: $TEACHER_PROFILES"
echo "  • Onboarding progress: $ONBOARDING_PROGRESS"
echo "  • Audio sessions: $AUDIO_SESSIONS"

if [ "$TOKENS_DELETED" -gt 0 ]; then
    echo "  • Expired tokens: $TOKENS_DELETED"
fi

echo ""
print_status "🚀 Ready for fresh onboarding!"