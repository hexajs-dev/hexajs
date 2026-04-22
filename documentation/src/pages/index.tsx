
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomePage/HomepageFeatures/HomePage';
import { HomepageHexa } from '../components/HomePage/Hompage';
import { FrameworkOverview } from '../components/HomePage/Overview/Overview';
import { SupportedBrowsers } from '../components/HomePage/SupportedBrowsers/SupportedBrowsers';
import HomePage from '@site/src/components/HomePage/index';



export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <HomePage>
      <Layout title={siteConfig.title} description={siteConfig.tagline}>
        <HomepageHexa />
        <main>
          <FrameworkOverview />
          <SupportedBrowsers />
          <HomepageFeatures />
        </main>
      </Layout>
    </HomePage>
  );
}
