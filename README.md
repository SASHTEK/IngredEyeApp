# IngredEye

Scan food labels. Know what's inside.

A cross-platform mobile app that uses your phone's camera to scan barcodes or ingredient labels, then tells you which additives are potentially harmful — powered by the Roots by Benda MCP API.

## Features

- Barcode scanning with automatic Open Food Facts product lookup
- On-device OCR via Google ML Kit (no network needed for text extraction)
- Real-time ingredient risk analysis with severity-coded cards
- Enriched safety data: safety scores, IARC classifications, pregnancy/children guidance
- Pin results with product names and brands, grouped by scan batch
- Community feed: share analyses, like posts, leave comments
- Anonymous sharing option
- Search, filter by severity, and sort pinned items
- Profile management and secure auth via Supabase

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 55) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL + RLS) |
| OCR | Google ML Kit TextRecognition |
| Barcode | expo-camera |
| Product Data | Open Food Facts REST API |
| Risk Analysis | Roots by Benda MCP API (JSON-RPC/SSE) |

## Quick Start

**Prerequisites:** Node.js 18+, Expo CLI, Android Studio or Xcode

```bash
# Clone the repo
git clone https://github.com/your-username/ingredeye.git
cd ingredeye

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

## Project Structure

```
ingredeye/
├── App.js                  # Root component with navigation
├── app.json                # Expo configuration
├── schema.sql              # Database schema (5 tables)
├── screens/
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── ScanScreen.js       # OCR + manual input
│   ├── BarcodeScreen.js
│   ├── ShareScreen.js      # Community feed
│   ├── PinnedScreen.js     # Saved analyses
│   └── ProfileScreen.js
├── utils/
│   ├── rootsBendaClient.js # MCP API client (JSON-RPC/SSE)
│   ├── ingredientUtils.js  # Ingredient parsing and display
│   └── communityUtils.js   # Community API helpers
├── components/             # Shared UI components
├── assets/                 # Icons and splash screen
└── package.json
```

## Database

The app uses five PostgreSQL tables managed through Supabase:

- `users` — User profiles (auto-created on signup)
- `pinned_items` — Saved ingredient analyses with enriched risk data
- `community_posts` — Shared analyses with JSONB items array
- `community_comments` — Comments on community posts
- `community_post_likes` — Like tracking with UNIQUE constraint

See [schema.sql](schema.sql) for the full DDL and RLS policies.

## License

MIT
