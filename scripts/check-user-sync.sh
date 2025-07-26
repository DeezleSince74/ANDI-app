#!/bin/bash

# Check User Sync Status Script
# Verifies that NextAuth users are properly synced to auth.users table

if [ -z "$1" ]; then
    echo "Usage: $0 <email>"
    echo "Example: $0 derekfrempong@gmail.com"
    exit 1
fi

EMAIL="$1"

echo "🔍 Checking user sync status for: $EMAIL"
echo "=================================================="

echo "📊 NextAuth user data (andi_web_user):"
docker exec andi-postgres psql -U andi_user -d andi_db -c "
SELECT id, name, email, image, role, \"createdAt\" 
FROM andi_web_user 
WHERE email = '$EMAIL';"

echo ""
echo "📊 Core database user data (auth.users):"
docker exec andi-postgres psql -U andi_user -d andi_db -c "
SELECT id, email, full_name, role, avatar_url, created_at 
FROM auth.users 
WHERE email = '$EMAIL';"

echo ""
echo "📊 Teacher profile data:"
docker exec andi-postgres psql -U andi_user -d andi_db -c "
SELECT user_id, onboarding_completed, voice_sample_url IS NOT NULL as has_voice_sample, created_at 
FROM core.teacher_profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = '$EMAIL');"

echo ""
echo "📊 Onboarding progress:"
docker exec andi-postgres psql -U andi_user -d andi_db -c "
SELECT user_id, current_step, array_length(completed_steps, 1) as steps_completed, completed_at IS NOT NULL as completed
FROM core.onboarding_progress 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = '$EMAIL');"

echo ""
echo "✅ Sync check complete!"