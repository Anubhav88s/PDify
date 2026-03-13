"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function BottomBannerAd({ adSlot }: { adSlot: string }) {
  const isAdLoaded = useRef(false);

  useEffect(() => {
    if (isAdLoaded.current || !adSlot) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isAdLoaded.current = true;
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [adSlot]);

  if (!adSlot) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 py-1">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: "728px", height: "90px" }}
        data-ad-client="ca-pub-7672562154863695"
        data-ad-slot={adSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
