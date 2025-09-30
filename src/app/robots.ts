export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meeplego.com'
  const isProduction = process.env.NODE_ENV === 'production' && 
                       siteUrl === 'https://meeplego.com'

  // Disallow staging/preview environments from being indexed
  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${siteUrl}/sitemap.xml`,
    }
  }

  // Production environment - allow indexing
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
