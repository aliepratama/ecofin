import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/utils/Helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const routes = ['', '/about', '/counter', '/portfolio'];

  // Generate portfolio detail pages
  const portfolioRoutes = Array.from(
    { length: 6 },
    (_, i) => `/portfolio/${i}`
  );
  const allRoutes = [...routes, ...portfolioRoutes];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
