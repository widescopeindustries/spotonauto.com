import { MetadataRoute } from 'next';
import { getWiringSeoPaths } from '@/data/wiring-seo-cluster';
import { getSitemapLastMod } from '@/lib/sitemap';

const LAST_MOD = getSitemapLastMod();

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://spotonauto.com';

  return getWiringSeoPaths().map((path) => ({
    url: `${baseUrl}/wiring/${path.year}/${path.make}/${path.model}/${path.system}`,
    lastModified: LAST_MOD,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));
}
