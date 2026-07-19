import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';

const brand = JSON.parse(readFileSync('../brand.config.json', 'utf8'));

export default defineConfig({
  // GitHub Pages: 'https://<org>.github.io' + base '/<repo>'
  // Custom domain (Cloudflare Pages): set site to the domain and drop `base`.
  site: process.env.SITE_URL ?? 'https://direct-launch.github.io',
  base: process.env.BASE_PATH ?? '/',
  integrations: [
    starlight({
      title: brand.site?.title ?? 'Brand Toolkit',
      description: brand.site?.description,
      customCss: ['./src/styles/brand.css'],
      editLink: {
        // Point at the repo so "Edit this page" lands on the source Markdown.
        baseUrl: process.env.REPO_URL ?? 'https://github.com/Direct-Launch/CHANGE-ME/edit/main/',
      },
      sidebar: [
        { label: 'Business', autogenerate: { directory: 'business' } },
        { label: 'Brand identity', autogenerate: { directory: 'identity' } },
        { label: 'Foundations', autogenerate: { directory: 'foundations' } },
        { label: 'Web', autogenerate: { directory: 'web' } },
      ],
      lastUpdated: true,
    }),
  ],
});
