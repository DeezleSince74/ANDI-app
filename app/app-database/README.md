# App Database - Firebase Configuration

This directory contains Firebase configuration and database schemas for ANDI's real-time data needs.

## Overview

Firebase provides the operational database layer for:
- User authentication and profiles
- Real-time session management
- Community features (posts, comments)
- File storage for audio recordings

## Structure

```
app-database/
├── schema/            # Firestore data models
├── rules/             # Security rules
├── functions/         # Cloud Functions
├── migrations/        # Schema migrations
└── seeds/            # Test data seeds
```

## Collections

### Core Collections
- `users` - Teacher profiles and preferences
- `schools` - School information
- `sessions` - Recording sessions
- `insights` - Generated insights
- `resources` - Educational resources
- `community` - Teacher Lounge posts

### Supporting Collections
- `audio_files` - Recording metadata
- `notifications` - Push notifications
- `analytics_events` - User events

## Security

- Row-level security for user data
- Role-based access (teacher, coach, admin)
- Encrypted sensitive information

## Integration

- **Storage**: Audio files in Firebase Storage
- **Auth**: Firebase Authentication
- **Functions**: Background processing
- **Analytics**: Event tracking