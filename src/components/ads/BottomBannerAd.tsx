"use client";

import { useEffect, useRef } from "react";

interface BottomBannerAdProps {
  adSlot: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function BottomBannerAd({ adSlot }: BottomBannerAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    if (isAdLoaded.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isAdLoaded.current = true;
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  const publisherId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "";

  if (!publisherId || !adSlot) return null;

  return (
    <div
      ref={adRef}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 py-1"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: "728px", height: "90px" }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
