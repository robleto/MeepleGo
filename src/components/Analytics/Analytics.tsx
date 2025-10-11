'use client'

import Script from 'next/script'

export default function Analytics() {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      {/* Umami Analytics - Load with lower priority to reduce impact on performance metrics */}
      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
        <Script
          src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="lazyOnload"
        />
      )}
      
      {/* Google Analytics (optional) - Load with lower priority */}
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      
      {/* Plausible Analytics (optional) - Load with lower priority */}
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="lazyOnload"
        />
      )}
    </>
  )
}