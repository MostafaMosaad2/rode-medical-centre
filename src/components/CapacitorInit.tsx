"use client";

import { useEffect } from "react";

/** Native shell polish when running inside the Capacitor Android app. */
export function CapacitorInit() {
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform() || cancelled) return;

        const [{ App }, { StatusBar, Style }, { SplashScreen }] =
          await Promise.all([
            import("@capacitor/app"),
            import("@capacitor/status-bar"),
            import("@capacitor/splash-screen"),
          ]);

        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0B3A6E" });
        await SplashScreen.hide();

        const backHandler = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.exitApp();
          }
        });

        return () => {
          void backHandler.remove();
        };
      } catch {
        // Web / SSR — ignore.
      }
    }

    let cleanup: (() => void) | undefined;
    void init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
