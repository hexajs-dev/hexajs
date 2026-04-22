import React from 'react';

type HomePageProps = {
  children: React.ReactNode;
};

export default function HomePage({ children }: HomePageProps) {
  return <div className="home-page">{children}</div>;
}
