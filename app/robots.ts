import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/orders/',
          '/runner/',
          '/tailor/',
          '/admin/',
          '/settings/',
          '/book/checkout',
          '/book/success',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
