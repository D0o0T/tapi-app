# Tapi Super-Search (v1.6.21)

Mobile client application for Tapi Super-Search built with React Native and Expo (SDK 54), adhering to strict product specification requirements and modern clean architecture standards.

---

## 🚀 Key Highlights & Architecture

- **100% Pure JavaScript**: Built completely with clean, modern ECMAScript (ES6+) with zero TypeScript dependencies.
- **Native Navigation**: Powered by `@react-navigation/native-stack` without Expo Router file-system routing conflicts.
- **Layered Architecture**:
  - `src/screens/`: Independent screen components implementing all user stories.
  - `src/navigation/`: Native Stack routing configuration.
  - `src/constants/`: Centralized design system tokens (colors, spacing, typography, radii).
  - `src/services/`: Resilient API service connecting to backend endpoints with an intelligent offline mock fallback.
  - `src/hooks/`: Custom reusable hooks (including `useDebounce` for search optimization).
  - `src/styles/`: Modular, maintainable StyleSheet abstractions.

---

## 📱 Features & Implemented Flows

1. **Unified Super-Search**:
   - Real-time search across Tasks, Bills, and Chats.
   - Filter pills with dynamic counts and empty states.
   - Search query debouncing (300ms) to conserve network and battery resources.
   - History retention with quick recents chips and clear actions.

2. **Task Flow**:
   - Detail view with status badge, priority, due date, description, and assignees.
   - Quick action to complete or re-open tasks.

3. **Bill Flow**:
   - Amount, payment status, due date, invoice ID, and line-item breakdown.
   - Actionable payment status toggling.

4. **Chat Flow**:
   - Interactive message history view with sender identification and message timestamps.
   - Quick messaging bar with live append capability.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (>= 18)
- npm or yarn
- Expo Go app or Android/iOS Emulator

### Installation

```bash
# Clone the repository
git clone <REPOSITORY_URL>
cd tapi-app-v2

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### Running on Devices
- **Android**: Press `a` in the terminal or run `npx expo run:android`
- **iOS**: Press `i` in the terminal or run `npx expo run:ios`
- **Web**: Press `w` in the terminal or run `npx expo start --web`

---

## 📁 Project Structure

```
tapi-app-v2/
├── assets/                  # App icons and splash assets
├── src/
│   ├── constants/
│   │   └── theme.js         # Design tokens & color palette
│   ├── hooks/
│   │   └── useDebounce.js   # Custom search debounce hook
│   ├── navigation/
│   │   └── AppNavigator.js  # React Navigation Native Stack
│   ├── screens/
│   │   ├── SearchScreen.js      # Unified search & filters
│   │   ├── TaskDetailScreen.js  # Task details & actions
│   │   ├── BillDetailScreen.js  # Bill invoice details
│   │   └── ChatDetailScreen.js  # Chat message thread
│   ├── services/
│   │   └── apiService.js    # API client with fallback data
│   └── styles/
│       └── Style.js         # App-wide styles
├── App.js                   # Root component
├── app.json                 # Expo configuration
├── index.js                 # Entry point
└── package.json             # Dependencies & scripts
```

---

## 📄 License
MIT License
