
import { DOC_ICONS, type DocIconKey } from '@site/src/components/icons/lucide';
import './Overview.scss';

const overviewFeatures = [
  {
    icon: 'wrench' as DocIconKey,
    title: 'Hexa CLI & Schematics',
    description: 'Accelerate delivery with the Hexa CLI and production-ready schematics that scaffold consistent extension architecture, wiring, and project conventions.',
  },
  {
    icon: 'cpu' as DocIconKey,
    title: 'Enterprise-Scale AOT Build',
    description: 'Use ahead-of-time compilation to generate optimized artifacts for large-scale extensions with predictable performance and strict Manifest V3 compatibility.',
  },
  {
    icon: 'workflow' as DocIconKey,
    title: 'Context-Aware Dependency Injection',
    description: 'Apply DI across background, content, and managed UI contexts with clear token boundaries that keep logic decoupled, testable, and maintainable.',
  },
  {
    icon: 'globe' as DocIconKey,
    title: 'Browser-Agnostic Build Layer',
    description: 'Ship a single codebase across major browsers using a managed ports layer that normalizes runtime differences and reduces platform-specific branching.',
  },
  {
    icon: 'panels' as DocIconKey,
    title: 'Managed UI for Popup & DevTools',
    description: 'Build structured Popup and DevTools interfaces with CLI-assisted setup and framework-level integration designed for extension workflows.',
  },
  {
    icon: 'database' as DocIconKey,
    title: 'Context-Aware Store Management',
    description: 'Manage store state context-wise for background and content, with reliable synchronization for consistent behavior across runtime boundaries.',
  },
  {
    icon: 'waypoints' as DocIconKey,
    title: 'Controllers, Handlers & Validation Pipes',
    description: 'Model background communication with Controllers and content behavior with Handlers, enforced by validation pipes for safe, predictable message contracts.',
  },
  {
    icon: 'refresh' as DocIconKey,
    title: 'Cross-Browser Hot Module Replacement',
    description: 'Iterate quickly with HMR across Chrome, Firefox, and Safari without repeatedly relaunching the extension or resetting active background state.',
  },
];

export function FrameworkOverview() {
  return (
    <section className="frameworkOverview">
      <div className="container">
        <div className="featureCards">
          {overviewFeatures.map(({ icon, title, description }) => {
            const Icon = DOC_ICONS[icon];

            return (
              <div key={title} className="featureCard">
                <div className="featureIconBox" aria-hidden="true">
                  <Icon size={26} strokeWidth={2} className="featureIconImage" />
                </div>
                <h3 className="featureTitle">{title}</h3>
                <p className="featureDescription">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
