import Heading from '@theme/Heading';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import './Hompage.scss';


export function HomepageHexa() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hexaBanner">
      <div className="container">
        <div className="hexaLogoWrapper">
          <img src="/img/hexa-logo.svg" alt="HexaJS Logo" className="hexaLogo" />
        </div>
        <Heading as="h1" className="hexaTitle">
          {siteConfig.title}
        </Heading>
        <p className="hexaSubtitle">{siteConfig.tagline}</p>
        <div className="hexaButtons">
          <Link className={clsx('button button--lg', 'btnPrimary')} to="/docs/getting-started">
            Get Started →
          </Link>
          <Link className={clsx('button button--lg', 'btnSecondary')} href="https://github.com/hexajs-dev/hexajs">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}
