"use client";

import { useEffect, useRef } from "react";

export function ScrollBackdrop() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      layer.style.setProperty("--scroll-y", `${y}px`);
      layer.style.setProperty("--scroll-shift", `${y * 0.22}px`);
      layer.style.setProperty("--scroll-shift-slow", `${y * 0.08}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="scroll-backdrop" ref={layerRef} aria-hidden>
      <div className="scroll-backdrop__orb scroll-backdrop__orb--one" />
      <div className="scroll-backdrop__orb scroll-backdrop__orb--two" />
      <div className="scroll-backdrop__orb scroll-backdrop__orb--three" />
      <div className="scroll-backdrop__grid" />
      <div className="scroll-backdrop__wave" />
    </div>
  );
}
