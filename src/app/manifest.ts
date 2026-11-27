import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cake Builder',
    short_name: 'Cake Builder',
    description: 'Plan ambitious cakes: flavors, layers, scaled recipes and a bake timeline.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#222222',
    icons: [
      // Placeholder until hi-fi: replace with real 192/512 PNGs in /public.
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  };
}
