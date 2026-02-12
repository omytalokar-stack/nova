<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nova AI - Voice Assistant

This contains everything you need to run your AI-powered voice assistant app locally and build it for Android.

View your app in AI Studio: https://ai.studio/apps/drive/1vbTx2A5_MsgBSb5TZfpwtjzpuQ5-MvCu

## Prerequisites

- Node.js (v18 or higher)
- Android SDK (for building Android)
- Java 17 (for Android builds)
- Gemini API Key

## Run Locally (Web)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## Build for Android

1. Build web assets:
   ```bash
   npm run build
   ```

2. Sync Capacitor with Android:
   ```bash
   npx cap sync android
   ```

3. Build APK (via Gradle in android folder):
   ```bash
   cd android
   ./gradlew build
   ```

Or build a release APK:
   ```bash
   cd android
   ./gradlew build --build-cache -PbuildProfile=release
   ```

## Project Structure

```
├── src/                    # React/TypeScript source code
│   ├── components/         # React components
│   ├── services/          # Android Bridge & audio utilities
│   └── App.tsx            # Main app component
├── android/               # Capacitor Android project
├── dist/                  # Built web assets
└── capacitor.config.ts    # Capacitor configuration
```

## Features

- 🎤 Voice input and processing
- 🧠 AI-powered responses using Gemini
- 📱 Native Android integration via Capacitor
- 🔔 Phone call integration (Android)
- 🔊 Audio playback and recording

## GitHub Actions CI/CD

Automatic builds are triggered on push to `main` branch. View workflow status in Actions tab.

## License

MIT
