import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "sa.rcmc.rode",
  appName: "Rode Medical Centre",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0B3A6E",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0B3A6E",
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0B3A6E",
  },
};

export default config;
