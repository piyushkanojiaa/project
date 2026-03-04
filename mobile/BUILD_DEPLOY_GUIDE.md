# Mobile App - Build & Deployment Guide

Complete guide for building and deploying the Orbital Guard AI mobile app.

---

## 📦 Prerequisites

### Required Tools

1. **Node.js** 18+ and npm
2. **Expo CLI**: `npm install -g expo-cli`
3. **EAS CLI**: `npm install -g eas-cli`
4. **Expo Account**: Sign up at [expo.dev](https://expo.dev)

### Platform-Specific Requirements

**iOS**:
- macOS (for building locally)
- Xcode 14+ (for local builds)
- Apple Developer Account ($99/year)

**Android**:
- Android Studio (for local builds)
- Google Play Developer Account ($25 one-time)

---

## 🚀 Build Process

### Step 1: Configure Project

```bash
# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Update app.json with your values
# - Bundle identifier (iOS): com.yourcompany.orbitalguard
# - Package name (Android): com.yourcompany.orbitalguard
```

### Step 2: Development Build

**For Testing on Physical Devices**:

```bash
# iOS Development Build
eas build --profile development --platform ios

# Android Development Build (APK)
eas build --profile development --platform android

# Install on device
# iOS: Use provided link or TestFlight
# Android: Download APK and install
```

### Step 3: Preview Build (Internal Testing)

```bash
# iOS Preview (Ad Hoc distribution)
eas build --profile preview --platform ios

# Android Preview (APK)
eas build --profile preview --platform android
```

### Step 4: Production Build

```bash
# iOS Production (App Store)
eas build --profile production --platform ios

# Android Production (Google Play - AAB)
eas build --profile production --platform android

# Or build both
eas build --profile production --platform all
```

---

## 📱 App Store Submission

### iOS (App Store)

#### 1. Prepare Assets

- **App Icon**: 1024x1024 PNG (no alpha)
- **Screenshots**: 
  - 6.5" (iPhone 14 Pro Max): 1284 x 2778
  - 5.5" (iPhone 8 Plus): 1242 x 2208
- **App Preview Video** (optional): 30-second demo

#### 2. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Apps** → **+** → **New App**
3. Fill in app information:
   - **Name**: Orbital Guard AI
   - **Bundle ID**: Select your configured bundle ID
   - **SKU**: orbital-guard-ai
   - **User Access**: Full Access

#### 3. Submit Build

```bash
# Build and auto-submit
eas submit --platform ios --latest

# Or manual submission:
# 1. Build completes → Available in App Store Connect
# 2. Go to "Build" section → Select build
# 3. Fill in remaining info (description, keywords, etc.)
# 4. Click "Submit for Review"
```

#### 4. App Information Checklist

- [ ] App Description (4000 chars max)
- [ ] Keywords (100 chars, comma-separated)
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy Policy URL (required)
- [ ] Category (Utilities or Productivity)
- [ ] Age Rating
- [ ] Copyright
- [ ] Contact Information

#### 5. Review Process

- **Time**: 1-3 days typically
- **Status**: Track in App Store Connect
- **Rejection**: Address issues and resubmit

---

### Android (Google Play)

#### 1. Prepare Assets

- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024 x 500 PNG
- **Screenshots**: 
  - Phone: At least 2 (1080 x 1920 minimum)
  - Tablet: Optional (7" or 10")
- **Promo Video**: YouTube URL (optional)

#### 2. Create App in Play Console

1. Go to [Play Console](https://play.google.com/console)
2. Click **Create App**
3. Fill in details:
   - **App Name**: Orbital Guard AI
   - **Default Language**: English (US)
   - **App or Game**: App
   - **Free or Paid**: Free

#### 3. Upload Build

```bash
# Build (if not done)
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android --latest

# Configure service account key if not set:
# Download JSON key from Google Cloud Console
# Place in project root as playstore-service-account.json
```

#### 4. Complete Store Listing

**Main Store Listing**:
- [ ] Short Description (80 chars)
- [ ] Full Description (4000 chars)
- [ ] App Icon
- [ ] Feature Graphic
- [ ] Screenshots (at least 2)

**Content Rating**:
- Complete questionnaire
- Should get "Everyone" rating

**App Content**:
- [ ] Privacy Policy URL
- [ ] App Access (public or restricted)
- [ ] Ads declaration (No ads)
- [ ] Data Safety (what data you collect)

**Countries & Pricing**:
- Select available countries
- Set price (Free)

#### 5. Release

1. Create **Production Release**
2. Upload AAB file (from EAS build)
3. Complete any remaining warnings
4. **Review and Rollout**
5. Click **Start Rollout to Production**

#### 6. Review Process

- **Time**: Few hours to 1 day
- **Status**: Track in Play Console
- **Updates**: Can be staged (e.g., 10% → 50% → 100%)

---

## 🔄 Over-the-Air (OTA) Updates

Update JavaScript/assets without rebuilding:

```bash
# Publish update
eas update --branch production --message "Bug fixes and improvements"

# Users get update on next app restart
```

**When to use OTA**:
- ✅ Bug fixes
- ✅ UI changes
- ✅ New screens/features (JS-only)
- ❌ Native dependency changes
- ❌ expo-notifications configuration changes

---

## 🧪 Testing Checklist

### Pre-Submission Testing

**Functionality**:
- [ ] Dashboard loads and displays stats
- [ ] Satellite list searchable/filterable
- [ ] Conjunction list sortable
- [ ] Settings save/load correctly
- [ ] Pull-to-refresh works
- [ ] Offline mode works
- [ ] Push notifications receive
- [ ] Background fetch triggers

**Performance**:
- [ ] App launches < 3 seconds
- [ ] Scrolling is smooth (60 FPS)
- [ ] No memory leaks (test 10+ min usage)
- [ ] Offline cache works

**Edge Cases**:
- [ ] No internet connection on launch
- [ ] Empty data states display
- [ ] Error states display
- [ ] Large datasets (100+ conjunctions)

**Devices**:
- [ ] iOS 15+ (iPhone 8 and newer)
- [ ] Android 10+ (various screen sizes)
- [ ] Tablet layouts (iPad, Android tablets)

---

## 📊 App Store Optimization (ASO)

### Keywords (iOS)

**Primary**: satellite, space, debris, tracking, orbit, collision, ISS

**Long-tail**: space debris tracking, satellite collision avoidance, orbital monitoring

### Description Template

**Short** (iOS) / **Short Description** (Android):
```
Track satellites and monitor collision risks in real-time. Stay informed about orbital conjunctions and space debris threats.
```

**Long Description**:
```
Orbital Guard AI - Your Space Situational Awareness Companion

Monitor thousands of satellites and debris objects in Earth's orbit. Get real-time alerts for potential collisions and track conjunction events.

FEATURES:
• Live satellite tracking
• Collision risk monitoring
• Push notifications for critical events
• Offline mode with cached data
• Beautiful 3D Earth visualization (coming soon)
• Advanced filtering and search

PERFECT FOR:
• Space enthusiasts
• Amateur astronomers
• Satellite operators
• Researchers
• Anyone interested in space

DATA SOURCES:
• NORAD TLE data
• NASA ODPO conjunction assessments
• Machine learning risk predictions

PRIVACY:
• No personal data collection
• All data encrypted
• No ads

Stay informed. Stay safe. Orbital Guard AI.
```

---

## 🔧 Troubleshooting

### Build Errors

**"No valid provisioning profile found" (iOS)**:
```bash
# Re-run configuration
eas build:configure

# Or manually update credentials
eas credentials
```

**"Build failed with error X" (Android)**:
```bash
# Clear build cache
eas build --clear-cache --platform android
```

### Submission Errors

**"App icon has alpha channel" (iOS)**:
- Remove transparency from icon
- Must be 1024x1024 PNG

**"Missing privacy policy" (Both)**:
- Add privacy policy URL to app.json
- Create privacy policy page (GitHub Pages, website)

**"Crashes on launch"**:
- Test with `--profile preview` first
- Check Crashlytics/Sentry logs
- Verify all API URLs are production-ready

---

## 📈 Post-Launch

### Monitoring

1. **Crash Reporting**: Set up Sentry or Crashlytics
2. **Analytics**: Expo Analytics or Firebase
3. **Performance**: Monitor app launch time, memory usage

### Updates

1. **Bug Fixes**: OTA update (instant)
2. **New Features**: New build (1-3 day review)
3. **Version Numbering**: 
   - Major.Minor.Patch (e.g., 1.0.0 → 1.0.1)
   - Increment buildNumber (iOS) and versionCode (Android)

### User Feedback

1. Monitor app store reviews
2. Respond to reviews (builds trust)
3. Create in-app feedback form
4. Track feature requests

---

## 🎯 Quick Reference

```bash
# Development
npm start              # Start dev server
npm run ios            # Test on iOS simulator
npm run android        # Test on Android emulator

# Building
eas build -p ios       # Build iOS
eas build -p android   # Build Android
eas build --platform all  # Build both

# Submitting
eas submit -p ios      # Submit to App Store
eas submit -p android  # Submit to Play Store

# Updating
eas update             # Publish OTA update

# Credentials
eas credentials        # Manage signing credentials
```

---

## 📞 Support

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction
- **EAS Submit**: https://docs.expo.dev/submit/introduction
- **Community**: https://forums.expo.dev

---

**Built with ❤️ using Expo** 🚀
