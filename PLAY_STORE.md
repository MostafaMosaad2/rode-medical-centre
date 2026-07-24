# Publish Rode Medical Centre on Google Play

This project is packaged as an Android app with **Capacitor**. The web UI is statically exported from Next.js into `out/`, then synced into `android/`.

**Application ID:** `sa.rcmc.rode`  
**App name:** Rode Medical Centre

## Prerequisites

- Node.js 20+
- JDK 21
- Android SDK (Platform 36 + Build-Tools)
- A [Google Play Console](https://play.google.com/console) developer account ($25 one-time)

## One-time: create an upload keystore

```bash
keytool -genkeypair -v \
  -keystore android/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

```bash
cp android/keystore.properties.example android/keystore.properties
# Edit android/keystore.properties with your real passwords / paths
```

Keep `upload-keystore.jks` and `keystore.properties` **offline and backed up**. Losing them makes updates painful.

Also create `android/local.properties` (gitignored):

```properties
sdk.dir=/path/to/Android/Sdk
```

## Build the Play upload (AAB)

```bash
npm install
npm run assets:mobile   # icons + splash from resources/
npm run android:build   # next build → cap sync → bundleRelease
```

Output:

`android/app/build/outputs/bundle/release/app-release.aab`

APK for device testing:

```bash
npm run android:apk
```

Open Android Studio:

```bash
npm run android:open
```

## Play Console checklist

1. Create app → **App name:** Rode Medical Centre (or Arabic store title).
2. Default language: Arabic (Saudi Arabia) recommended; add English.
3. App category: **Medical** (or Health & Fitness if that fits better).
4. Upload the `.aab` under **Production** (or Internal testing first).
5. Complete **Data safety**: this app does not collect account/health records; language preference stays on-device.
6. Privacy policy URL: host the site (or `/privacy/`) publicly and paste that URL. Play requires a live HTTPS URL.
7. Store listing assets (starter files in `play-store/listing-assets/`):
   - App icon 512×512 → `icon-512.png`
   - Feature graphic 1024×500 → `feature-graphic-1024x500.png`
   - Phone screenshots (at least 2) from an emulator or device
8. Content rating questionnaire.
9. Target audience / news apps / COVID / health declarations as prompted (this is a clinic info app, not a medical device).
10. Submit for review.

## After each content update

```bash
# bump versionCode / versionName in android/app/build.gradle
npm run android:build
# upload the new AAB in Play Console
```

## Notes

- Phone, WhatsApp, and Maps links open the system apps (Android package queries are configured).
- The Android project under `android/` is meant to be committed so CI/local builds stay reproducible.
- Do **not** commit keystores, `keystore.properties`, or `local.properties`.
