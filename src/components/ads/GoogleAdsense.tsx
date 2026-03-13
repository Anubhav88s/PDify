"use client";

import Script from "next/script";

export function GoogleAdsense() {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7672562154863695"
      crossOrigin="anonymous"
      strategy="beforeInteractive"
    />
  );
}
