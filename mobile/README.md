# Orbital Guard AI - Mobile App

**Cross-platform mobile application for iOS and Android**

Built with React Native (Expo) for space debris monitoring and collision avoidance.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app (for testing on physical device)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (for quick testing)
npm run web
```

### Using Expo Go

1. Install **Expo Go** app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start dev server: `npm start`

3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app

---

## 📱 Features

### Dashboard
- **Live Statistics**: Satellite count, active conjunctions, critical risks
- **Recent Events**: Last 10 conjunction events
- **Pull-to-Refresh**: Manual data updates
- **Auto-Polling**: Updates every 30-60 seconds

### Satellites
- **Searchable List**: Search by name or NORAD ID
- **Filtering**: Active satellites vs debris
- **Details**: Altitude, TLE data, position

### Conjunctions
- **Risk Filtering**: All, Critical, High risk
- **Multi-Sort**: By time, risk level, or distance
- **Color Coding**: Visual risk indicators
- **Event Details**: Miss distance, probability, TCA

### Settings
- **API Configuration**: Custom backend URL
- **Notifications**: Enable/disable alerts by risk level
- **Update Interval**: Configure polling frequency
- **Cache Management**: Clear local data

---

## 🏗️ Project Structure

```
mobile/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Dashboard
│   │   ├── satellites.tsx       # Satellite list
│   │   ├── conjunctions.tsx     # Conjunction list
│   │   └── settings.tsx         # Settings
│   └── _layout.tsx              # Root layout + providers
│
├── components/                   # UI components
│   ├── dashboard/
│   │   └── StatsCard.tsx
│   ├── satellite/
│   │   └── SatelliteList.tsx
│   └── conjunction/
│       ├── ConjunctionCard.tsx
│       └── ConjunctionList.tsx
│
├── services/                     # Business logic
│   └── graphql/
│       ├── client.ts            # Apollo Client
│       └── queries.ts           # GraphQL queries
│
├── hooks/                        # Custom hooks
│   ├── useSatellites.ts
│   └── useConjunctions.ts
│
├── types/
│   └── index.ts                 # TypeScript types
│
└── app.json                      # Expo configuration
```

---

## ⚙️ Configuration

### Backend API

Update the API URL in `services/graphql/client.ts`:

```typescript
const API_URL = 'http://YOUR_IP_ADDRESS:8000/graphql';
```

> **Important**: Use your computer's IP address (not `localhost`) when testing on a physical device.

### Find Your IP Address

**Windows**:
```bash
ipconfig
# Look for "IPv4 Address"
```

**macOS/Linux**:
```bash
ifconfig
# Look for "inet" under your network interface
```

**Example**:
```typescript
const API_URL = 'http://192.168.1.100:8000/graphql';
```

---

## 🎨 Design System

### Colors

| Color | Usage | Hex |
|-------|-------|-----|
| **Cyan** | Primary accent | `#00ffff` |
| **Dark Blue** | Cards | `rgba(10, 25, 47, 0.95)` |
| **Space Black** | Background | `#000510` |
| **Critical Red** | High risk | `#ff3366` |
| **Warning Orange** | Medium-high | `#ff9800` |
| **Caution Yellow** | Medium | `#ffaa00` |
| **Safe Green** | Low risk | `#4caf50` |

### Typography

- Material Design 3 (Paper)
- System fonts (San Francisco on iOS, Roboto on Android)

---

## 🔧 Development

### Hot Reload

Changes to code are automatically reflected in the app without manual refresh.

### Debugging

**React DevTools**:
- Shake device or press `Cmd+D` (iOS), `Cmd+M` (Android)
- Select "Debug Remote JS"

**Expo DevTools**:
- Open browser to `http://localhost:19002`
- View logs, network requests, etc.

### TypeScript

Full TypeScript support with strict mode enabled.

```bash
# Type checking
npx tsc --noEmit
```

---

## 🧪 Testing

### Unit Tests (Jest)

```bash
npm test
```

### E2E Tests (Detox - Future)

```bash
# iOS
detox test --configuration ios

# Android
detox test --configuration android
```

---

## 📦 Building for Production

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

### Local Build

**iOS** (Requires macOS + Xcode):
```bash
expo prebuild
npx expo run:ios --configuration Release
```

**Android**:
```bash
expo prebuild
npx expo run:android --variant release
```

---

## 📱 App Store Deployment

### iOS (App Store)

1. Create app in **App Store Connect**
2. Build with EAS: `eas build --platform ios`
3. Submit: `eas submit --platform ios`
4. Fill app details, screenshots, description
5. Submit for review

### Android (Play Store)

1. Create app in **Google Play Console**
2. Build with EAS: `eas build --platform android`
3. Submit: `eas submit --platform android`
4. Fill app details, screenshots, description
5. Submit for review

---

## 🐛 Troubleshooting

### Common Issues

**"Unable to connect to backend"**
- Check API URL in settings
- Ensure backend is running
- Use IP address, not `localhost`
- Check firewall settings

**"App crashes on launch"**
- Clear cache: Settings → Clear Cache
- Reinstall app
- Check console logs

**"Notifications not working"**
- Grant notification permissions
- Enable in Settings
- Check notification settings on device

---

## 📚 Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Apollo Client** - GraphQL client
- **React Native Paper** - UI components
- **Expo Router** - File-based routing
- **AsyncStorage** - Local storage
- **MMKV** - Fast key-value storage

---

## 📖 Documentation

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

---

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## 📄 License

MIT License - see LICENSE file

---

## 🔗 Related Projects

- **Backend API**: `../backend/`
- **Web App**: `../frontend/`
- **Desktop App**: `../desktop/`

---

## 📞 Support

- Issues: GitHub Issues
- Email: support@orbitalguard.ai
- Discord: [Join our server](https://discord.gg/orbital-guard-ai)

---

**Built with ❤️ by the Orbital Guard AI Team**
