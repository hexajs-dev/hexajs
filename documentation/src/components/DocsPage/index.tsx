import React from 'react';
import './DocsPage.scss';

type DocsPageProps = {
  children: React.ReactNode;
};

export default function DocsPage({ children }: DocsPageProps) {
  return (
    <div className="hexa-docs-page">
      {children}
    </div>
  );
}
