import type {PrismTheme} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import llmsTxt from './plugins/llms-txt';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Token colours from the design system scales. Light: every colour is at
// least 4.5:1 on the muted background; dark: on charcoal-950.
const prismLight: PrismTheme = {
  plain: {color: '#233D4D', backgroundColor: '#F1F5F8'},
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: '#566E7E', fontStyle: 'italic'}},
    {types: ['punctuation', 'operator'], style: {color: '#486172'}},
    {types: ['keyword', 'atrule', 'selector', 'important'], style: {color: '#954203'}},
    {types: ['string', 'char', 'attr-value', 'regex', 'url', 'inserted'], style: {color: '#4F6635'}},
    {types: ['function', 'function-variable', 'class-name', 'builtin'], style: {color: '#35695B'}},
    {types: ['number', 'boolean', 'constant', 'symbol'], style: {color: '#755900'}},
    {types: ['tag', 'attr-name', 'property', 'namespace'], style: {color: '#204F42'}},
    {types: ['deleted'], style: {color: '#A12531'}},
  ],
};

const prismDark: PrismTheme = {
  plain: {color: '#FAF7F2', backgroundColor: '#07202D'},
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: '#9BAEBB', fontStyle: 'italic'}},
    {types: ['punctuation', 'operator'], style: {color: '#B7C7D2'}},
    {types: ['keyword', 'atrule', 'selector', 'important'], style: {color: '#FE7F2D'}},
    {types: ['string', 'char', 'attr-value', 'regex', 'url', 'inserted'], style: {color: '#B0D191'}},
    {types: ['function', 'function-variable', 'class-name', 'builtin'], style: {color: '#FCCA46'}},
    {types: ['number', 'boolean', 'constant', 'symbol'], style: {color: '#FEAF84'}},
    {types: ['tag', 'attr-name', 'property', 'namespace'], style: {color: '#9CD1C1'}},
    {types: ['deleted'], style: {color: '#F2737A'}},
  ],
};

const config: Config = {
  title: 'Flightroom',
  tagline: 'Apps and AI agents, built by anyone, shipped in one click',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://flightroom.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/documentation',

  // GitHub Pages serves every page from <path>/index.html and 301s /<path> to
  // /<path>/. Left unset, Docusaurus emits sitemap entries, canonicals and
  // internal links without the slash, so every URL we hand to Google is a
  // redirect and the page it lands on points its canonical back at the
  // redirecting URL. Emitting the slash ourselves matches what the host
  // actually serves.
  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'flightroom', // Usually your GitHub org/user name.
  projectName: 'documentation', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  // The documentation is written in English only. Adding a locale here without
  // translations under i18n/<locale>/ publishes a duplicate of the English
  // pages under /<locale>/, which search engines treat as duplicate content.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Architecture diagrams are written as ```mermaid fences so they stay
  // diffable and follow the site theme, instead of shipping as flat images.
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  plugins: [
    [
      '@docusaurus/plugin-google-gtag',
      {
        // Two IDs on purpose. The docs keep their own history in G-JS73D8WDB9,
        // and also report into the main site's property, G-SX41W7EVTN. They are
        // one site on one domain, but were split across two properties, so a
        // visit that starts on the marketing pages and continues into the docs
        // was two unjoinable halves and neither property could show the whole
        // journey. The plugin accepts an array and loads both tags.
        trackingID: ['G-JS73D8WDB9', 'G-SX41W7EVTN'],
      },
    ],
    // Emits /llms.txt, /llms-full.txt and a .md next to every doc page.
    llmsTxt,
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/flightroom/documentation/blob/main',
        },
        // No blog: nothing links to it and it only carried the Docusaurus
        // sample posts, which were indexable. Set this back to an options
        // object when there is something to publish.
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          // Let crawlers prioritise pages that actually changed.
          lastmod: 'date',
          changefreq: null,
          priority: null,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Rendered from static/img/social-card.source.html at 1200x630.
    image: 'img/social-card.png',
    navbar: {
      title: 'Flightroom',
      logo: {
        alt: 'Flightroom logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/quick-start',
          label: 'Quick start',
          position: 'left',
        },
        {
          to: '/docs/self-hosting/docker',
          label: 'Self-hosting',
          position: 'left',
        },
        // {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/flightroom',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://console.flightroom.dev',
          label: 'Open the console',
          position: 'right',
          className: 'navbar__cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Product',
          items: [
            {
              label: 'Quick start',
              to: '/docs/quick-start',
            },
            {
              label: 'Get started',
              to: '/docs/intro',
            },
            {
              label: 'Core concepts',
              to: '/docs/core-concepts',
            },
            {
              label: 'Templates library',
              to: '/docs/templates/templates-library',
            },
            {
              label: 'Open the console',
              href: 'https://console.flightroom.dev',
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            {
              label: 'Build with AI',
              to: '/docs/build-with-ai/overview',
            },
            {
              label: 'Deploy to Kubernetes',
              to: '/docs/kubernetes/overview',
            },
            {
              label: 'Environments',
              to: '/docs/environments/overview',
            },
            {
              label: 'Microfrontends',
              to: '/docs/microfrontends/overview',
            },
          ],
        },
        {
          title: 'Run it yourself',
          items: [
            {
              label: 'Helm (Kubernetes)',
              to: '/docs/self-hosting/helm',
            },
            {
              label: 'Docker',
              to: '/docs/self-hosting/docker',
            },
            {
              label: 'Terraform',
              to: '/docs/self-hosting/terraform',
            },
            {
              label: 'CI/CD',
              to: '/docs/ci-cd/api-keys',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/flightroom',
            },
          ],
        },
        /*{
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'X',
              href: 'https://x.com/docusaurus',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },*/
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Flightroom, Inc. Built with Docusaurus.`,
    },
    // Code highlighting in the Flightroom palette: the stock github and
    // dracula themes both colour tokens in violet.
    prism: {
      theme: prismLight,
      darkTheme: prismDark,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
