"use client";

import Script from "next/script";

const PUBLISHER_ID = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "";

export function GoogleAdsense() {
  if (!PUBLISHER_ID) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
