# Rode Medical Centre

Bilingual (Arabic / English) website and **Android app** for **مجمع رود الشامل الطبي العام — Rode Medical Centre** in Madinah.

## Features

- RTL Arabic by default, with one-click English toggle
- Home, Services, About, Contact, and Privacy pages
- Call, WhatsApp, Google Maps, and Linktree actions
- Brand colors from the clinic logo (cyan → royal blue, lime green)
- Capacitor Android shell ready for Google Play (`sa.rcmc.rode`)

## Contact

- **Phone:** 0510598448 (call & WhatsApp) · 920005620 (call only)
- **Address:** 3064 8102 Sultanah Rd, Al Rayah, Madinah 42312
- **Linktree:** https://linktr.ee/rcmc.sa

## Develop (web)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build (web)

```bash
npm run build
```

Static export lands in `out/` (used by the Android app).

## Android / Play Store

See **[PLAY_STORE.md](./PLAY_STORE.md)** for signing, AAB builds, and Play Console steps.

Quick build (requires Android SDK + `android/keystore.properties`):

```bash
npm run android:build
```
