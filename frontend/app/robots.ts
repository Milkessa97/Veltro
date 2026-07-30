import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veltro-dev.vercel.app'
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/terms', '/privacy', '/docs'],
      disallow: ['/dashboard/', '/onboarding/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
