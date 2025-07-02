# Web App - ANDI React Native Application

This directory contains the React Native mobile application for ANDI.

## Overview

The ANDI mobile app provides:
- Cross-platform support (iOS & Android)
- Audio recording and management
- AI-powered insights and coaching
- Community features
- Resource library

## Structure

```
web-app/
├── src/               # Source code
│   ├── components/    # Reusable components
│   ├── screens/       # Screen components
│   ├── navigation/    # Navigation setup
│   ├── services/      # API services
│   ├── store/         # State management
│   └── utils/         # Utility functions
├── assets/            # Images, fonts, etc.
├── ios/               # iOS-specific code
├── android/           # Android-specific code
└── __tests__/         # Test files
```

## Tech Stack

- **Framework**: React Native + TypeScript
- **Navigation**: React Navigation
- **State**: Redux Toolkit / Context API
- **UI**: Custom components + React Native Elements
- **Audio**: React Native Audio Recorder
- **Backend**: Firebase SDK
- **Analytics**: Firebase Analytics

## Key Features

1. **Authentication Flow**
   - Sign up/Login
   - Password reset
   - Profile management

2. **Recording System**
   - Audio capture
   - Session management
   - Upload to cloud

3. **Insights Dashboard**
   - AI-generated summaries
   - Performance metrics
   - Recommendations

4. **Community Features**
   - Teacher Lounge
   - Resource sharing
   - Peer support

## Development

```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test
```