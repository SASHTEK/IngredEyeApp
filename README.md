# IngredEye Scanner

**Safety at your fingertips**

> A university project by **Shashika Kulasekara** — BIT, Faculty of IT, University of Moratuwa

A cross-platform mobile app that uses your phone's camera to scan barcodes or ingredient labels, then tells you which additives are potentially harmful — powered by the Roots by Benda MCP API.

## Download

📱 **[Download APK (Android)](https://drive.google.com/file/d/1aoTHguvqcVn9Nxi0x1WljU5XYbWi5KHT/view?usp=sharing)** — Install directly on your Android device

> **Note:** You may need to enable "Install from unknown sources" in your device settings to install the APK.

## Features

- **OCR Scan** — Capture ingredient labels with your camera and extract text automatically
- **Barcode Scan** — Scan product barcodes for instant ingredient lookup via Open Food Facts
- **Manual Search** — Type ingredient names directly for quick safety checks
- **Risk Analysis** — Severity-coded cards (Critical / High / Medium / Low) with health details
- **Enriched Data** — Safety scores, IARC cancer classifications, pregnancy and children guidance
- **Pin Results** — Save analyses with product names and brands, grouped by scan batch
- **Community Feed** — Share analyses, like posts, and leave comments
- **Anonymous Sharing** — Share results without revealing your identity
- **Help & In-App Guide** — Collapsible help sections explaining every feature
- **About & Credits** — Data sources and project information
- **Search & Filter** — Find pinned items by name, filter by severity, and sort
- **Secure Auth** — Profile management via Supabase Authentication

## Screens

| Screen | Description |
|---|---|
| Scan | OCR camera + manual ingredient input |
| Barcode | Barcode scanner with product lookup |
| Share | Community feed of shared analyses |
| Pinned | Saved ingredient analyses |
| Profile | User info, Help, and About |
| Help | In-app guide with collapsible sections |
| About | Credits, data sources, and app info |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 55) |
| Navigation | React Navigation (Bottom Tabs + Stack) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL + RLS) |
| OCR | Google ML Kit TextRecognition |
| Barcode | expo-camera |
| Product Data | Open Food Facts REST API |
| Risk Analysis | Roots by Benda MCP API (JSON-RPC/SSE) |

## Data Sources

- **Roots by Benda** — Food additive safety database
- **JECFA** — Joint FAO/WHO Expert Committee on Food Additives
- **EFSA** — European Food Safety Authority
- **FDA** — U.S. Food and Drug Administration
- **Open Food Facts** — Open product database for barcode data

## Quick Start

**Prerequisites:** Node.js 18+, Expo CLI, Android Studio or Xcode

```bash
# Clone the repo
git clone https://github.com/SASHTEK/IngredEyeApp.git
cd IngredEyeApp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the app
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS.

## Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Setup Your Own Instance

This project requires a Supabase backend. Follow these steps to run your own instance:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema** — Go to the SQL Editor in Supabase dashboard and paste the contents of `schema.sql`, then run it

3. **Get your credentials** — In Supabase dashboard, go to Settings → API and copy:
   - Project URL
   - Anon (public) key

4. **Update the three files** with your credentials:

   | File | What to replace |
   |---|---|
   | `.env` | `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
   | `eas.json` | Same two values in the `preview.env` section |
   | `web/reset-password.html` | `SUPABASE_URL` and `SUPABASE_ANON_KEY` (lines 197-198) |
   | `screens/ForgotPasswordScreen.js` | `YOUR_RESET_PASSWORD_URL` (line 30) — see Password Reset Setup below |

5. **Start the app**
   ```bash
   npx expo start
   ```

> **Note:** The app will not work without valid Supabase credentials. All authentication, data storage, and community features depend on this backend.

## Password Reset Setup

The password reset flow requires hosting a static HTML page. Follow these steps:

1. **Host the reset page** — Deploy `web/reset-password.html` to a static hosting service:
   - [Netlify](https://netlify.com)
   - [Vercel](https://vercel.com)
   - [GitHub Pages](https://pages.github.com)

2. **Update the redirect URL** in `screens/ForgotPasswordScreen.js` (line 30):
   ```js
   redirectTo: 'https://your-hosted-url.com/reset-password.html',
   ```

3. **Configure Supabase** — Go to your Supabase dashboard → Authentication → URL Configuration → Redirect URLs and add your hosted URL

4. **Update credentials** in the hosted `reset-password.html` file with your Supabase URL and anon key

> **Note:** Without this setup, the "Forgot Password" feature will not work.

## Project Structure

```
ingredeye/
├── App.js                  # Root component with navigation
├── app.json                # Expo configuration
├── eas.json                # EAS Build profiles
├── schema.sql              # Database schema
├── screens/
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── ForgotPasswordScreen.js
│   ├── ScanScreen.js       # OCR + manual input
│   ├── ScanBarcodeScreen.js
│   ├── ShareScreen.js      # Community feed
│   ├── PinnedItemsScreen.js
│   ├── ProfileScreen.js
│   ├── HelpScreen.js       # In-app help guide
│   └── AboutScreen.js      # Credits & data sources
├── components/
│   └── RiskDisplay.js      # Shared risk card component
├── utils/
│   ├── rootsBendaClient.js # MCP API client (JSON-RPC/SSE)
│   ├── ingredientUtils.js  # Ingredient parsing and display
│   ├── communityUtils.js   # Community API helpers
│   └── supabaseClient.js   # Supabase configuration
├── assets/                 # Icons and splash screen
└── package.json
```

## Database

The app uses PostgreSQL tables managed through Supabase:

- `users` — User profiles (auto-created on signup)
- `pinned_items` — Saved ingredient analyses with enriched risk data
- `community_posts` — Shared analyses with JSONB items array
- `community_comments` — Comments on community posts
- `community_post_likes` — Like tracking with UNIQUE constraint

See [schema.sql](schema.sql) for the full DDL and RLS policies.

## Academic Information

This project was developed as part of the Bachelor of Information Technology (BIT) degree program at the Faculty of IT, University of Moratuwa.

## License

MIT
