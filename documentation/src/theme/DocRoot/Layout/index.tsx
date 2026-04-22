import React from 'react';
import OriginalDocRootLayout from '@theme-original/DocRoot/Layout';
import DocLayoutEnhancer from '@site/src/theme/DocLayoutEnhancer';
import DocsPage from '@site/src/components/DocsPage';

type Props = React.ComponentProps<typeof OriginalDocRootLayout>;

export default function DocRootLayout(props: Props) {
  return (
    <DocsPage>
      <DocLayoutEnhancer />
      <OriginalDocRootLayout {...props} />
    </DocsPage>
  );
}
