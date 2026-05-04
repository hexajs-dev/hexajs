import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  plugins: ['docusaurus-plugin-sass'],
  title: 'HexaJS',
  tagline: 'Build browser extensions like real applications',
  favicon: 'img/hexa-logo.svg',

  url: 'https://hexajs.dev',
  baseUrl: '/',

  organizationName: 'hexajs-dev',
  projectName: 'hexajs',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
        theme: {
          customCss: './src/theme/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/hexa-logo.svg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'HexaJS',
      hideOnScroll: false,
      logo: {
        alt: 'HexaJS Logo',
        src: 'img/hexa-logo.svg',
        height: 32,
        width: 32,
      },
      items: [
        {
          to: '/docs/getting-started',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/hexajs-dev/hexajs',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `© ${new Date().getFullYear()} HexaJS · <a class="footer-inline-link" href="/docs/getting-started">Docs</a> · <a class="footer-inline-link" href="/docs/core-fundamentals">Core</a> · <a class="footer-inline-link" href="/docs/cli-tooling">CLI</a> · <a class="footer-inline-link" href="https://github.com/hexajs-dev/hexajs" target="_blank" rel="noopener noreferrer">GitHub</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['typescript', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
