import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { DOC_ICONS, type DocIconKey } from '@site/src/components/icons/lucide';
import './HomePage.scss';


type AudienceType = 'beginner' | 'intermediate' | 'advanced' | 'all';

interface FeatureItem {
  title: string;
  icon: DocIconKey;
  audience: string;
  audienceType: AudienceType;
  description: string;
  to: string;
}

const features: FeatureItem[] = [
  {
    title: 'Getting Started',
    icon: 'rocket',
    audience: 'New Users',
    audienceType: 'beginner',
    description: 'Get a basic browser extension compiling and running in under 5 minutes using the HexaJS CLI scaffold.',
    to: '/docs/getting-started',
  },
  {
    title: 'Core Fundamentals',
    icon: 'puzzle',
    audience: 'Intermediate',
    audienceType: 'intermediate',
    description: "Learn the framework's architecture — Dependency Injection, Controllers, Decorators, and Tokens.",
    to: '/docs/core-fundamentals',
  },
  {
    title: 'State Management',
    icon: 'database',
    audience: 'Intermediate / Advanced',
    audienceType: 'advanced',
    description: 'Model predictable state changes with actions, reducers, and selectors in Background and Content contexts.',
    to: '/docs/state-management',
  },
  {
    title: 'Managed UI',
    icon: 'paintbrush',
    audience: 'Intermediate',
    audienceType: 'intermediate',
    description: 'Build React-powered popups and devtools panels with full DI/Token support and an integrated Vite build.',
    to: '/docs/managed-ui',
  },
  {
    title: 'Browser-Agnostic Messaging',
    icon: 'shuffle',
    audience: 'Advanced',
    audienceType: 'advanced',
    description: 'Build routing and platform-aware communication on top of typed clients and browser-agnostic ports.',
    to: '/docs/browser-agnostic-messaging',
  },
  {
    title: 'CLI & Tooling',
    icon: 'cog',
    audience: 'All Users',
    audienceType: 'all',
    description: 'Deep-dive into the build pipeline, Manifest patching, HMR mechanics, and every CLI command.',
    to: '/docs/cli-tooling',
  },
];

function FeatureCard({ title, icon, audience, audienceType, description, to }: FeatureItem) {
  const Icon = DOC_ICONS[icon];

  return (
    <Link to={to} className="card">
      <div className="cardIcon" aria-hidden="true">
        <Icon size={28} strokeWidth={2} />
      </div>
      <div className="cardContent">
        <h3 className="cardTitle">{title}</h3>
        <span className={clsx('badge', `badge--${audienceType}`)}>{audience}</span>
        <p className="cardDescription">{description}</p>
      </div>
      <div className="cardArrow">→</div>
    </Link>
  );
}

export default function HomepageFeatures() {
  return (
    <section className="featuresSection">
      <div className="container">
        <div className="sectionHeader">
          <h2 className="sectionTitle">
            Everything you need to build{' '}
            <span className="accent">powerful extensions</span>
          </h2>
          <p className="sectionSubtitle">
            HexaJS brings NestJS‑style architecture to the browser extension world.
          </p>
        </div>
        <div className="featuresGrid">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
