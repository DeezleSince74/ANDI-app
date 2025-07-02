# App Database - PostgreSQL/Supabase Configuration

This directory contains database schemas and configurations for ANDI's operational data needs.

## Overview

The database provides the operational layer for:
- User authentication and profiles
- Session management
- Community features (posts, comments)
- Audio recording metadata
- Real-time subscriptions

## Structure

```
app-database/
├── schema/            # Database schema definitions
├── migrations/        # Database migrations
├── functions/         # Stored procedures
├── triggers/          # Database triggers
├── policies/          # Row-level security policies
└── seeds/            # Test data seeds
```

## Tables

### Core Tables
- `users` - Teacher profiles and preferences
- `schools` - School information
- `sessions` - Recording sessions
- `insights` - Generated insights
- `resources` - Educational resources
- `community_posts` - Teacher Lounge posts

### Supporting Tables
- `audio_files` - Recording metadata and URLs
- `notifications` - User notifications
- `analytics_events` - User activity tracking
- `user_preferences` - User settings

## Security

- Row-level security (RLS) policies
- Role-based access control (teacher, coach, admin)
- Encrypted sensitive data
- API key management

## Integration

- **Storage**: Audio files in cloud storage (S3/GCS)
- **Auth**: Supabase Auth / NextAuth.js
- **Real-time**: Supabase real-time subscriptions
- **Analytics**: Events pipeline to ClickHouse