import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';
import remarkBrandBlocks from './src/plugins/remark-brand-blocks.mjs';

const brand = JSON.parse(readFileSync('../brand.config.json', 'utf8'));
const theme = brand.site?.theme ?? {};

export default defineConfig({
  // GitHub Pages: 'https://<org>.github.io' + base '/<repo>'
  // Custom domain (Cloudflare Pages): set SITE_URL and leave BASE_PATH as '/'.
  site: process.env.SITE_URL ?? 'https://direct-launch.github.io',
  base: process.env.BASE_PATH ?? '/',
  markdown: {
    // Turns fenced `palette`, `specimen`, `dodont` etc. blocks into live visuals.
    remarkPlugins: [remarkBrandBlocks],
  },
  integrations: [
    starlight({
      title: brand.site?.title ?? 'Brand Toolkit',
      description: brand.site?.description,
      logo: theme.logo
        ? { src: `./public/${theme.logo}`, replacesTitle: theme.logoReplacesTitle ?? false }
        : undefined,
      customCss: [
        './src/styles/tokens.css',       // generated from brand.json
        './src/styles/brand-blocks.css', // specimen block styling
        './src/styles/custom.css',       // per-client overrides, edit freely
      ],
      editLink: {
        baseUrl: process.env.REPO_URL ?? 'https://github.com/Direct-Launch/CHANGE-ME/edit/main/',
      },
      sidebar: [
        { label: 'Business', autogenerate: { directory: 'business' } },
        { label: 'Brand identity', autogenerate: { directory: 'identity' } },
        { label: 'Foundations', autogenerate: { directory: 'foundations' } },
        { label: 'Web', autogenerate: { directory: 'web' } },
        { label: 'Reference', items: [{ label: 'All tokens', link: '/tokens/' }] },
      ],
      lastUpdated: true,
      pagination: false,
      credits: false,
    }),
  ],
});
