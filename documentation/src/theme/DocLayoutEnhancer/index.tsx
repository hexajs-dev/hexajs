import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@docusaurus/router';

function useDocSidebarState(pathname: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [sidebarContainer, setSidebarContainer] = useState<HTMLElement | null>(null);
  const [mainContent, setMainContent] = useState<HTMLElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const sidebar = document.querySelector('.theme-doc-sidebar-container') as HTMLElement | null;
    const main = document.querySelector('.docusaurus-mt-lg') as HTMLElement | null;
    const docRoot = document.querySelector("div[class*='docRoot_']") as HTMLElement | null;
    const docMain = document.querySelector("main[class*='docMainContainer_']") as HTMLElement | null;
    const docItemCol = document.querySelector("div[class*='docItemCol_']") as HTMLElement | null;

    document.body.classList.toggle('hexa-docs-layout', Boolean(sidebar));

    docRoot?.classList.add('hexa-docs-root');
    docMain?.classList.add('hexa-docs-main');
    docItemCol?.classList.add('hexa-docs-item-col');

    if (!sidebar || !main) {
      setSidebarContainer(null);
      setMainContent(null);
      setPortalHost(null);
      setIsOpen(false);
      setIsPinned(false);
      document.body.style.overflow = '';
      return;
    }

    const savedPinnedState = localStorage.getItem('docSidebarPinned');
    const pinned = savedPinnedState ? JSON.parse(savedPinnedState) : false;

    setSidebarContainer(sidebar);
    setMainContent(main);
    setIsPinned(Boolean(pinned));
    setIsOpen(false);

    const menu = sidebar.querySelector('.menu') as HTMLElement | null;
    if (menu) {
      let host = menu.querySelector('.sidebar-react-host') as HTMLElement | null;
      if (!host) {
        host = document.createElement('div');
        host.className = 'sidebar-react-host';
        menu.insertBefore(host, menu.firstChild);
      }
      setPortalHost(host);
    }

    return () => {
      document.body.classList.remove('hexa-docs-layout');
      document.body.style.overflow = '';
      setPortalHost(null);
    };
  }, [pathname]);

  useEffect(() => {
    if (!sidebarContainer || !mainContent) {
      return;
    }

    sidebarContainer.setAttribute('data-sidebar-open', String(isOpen));
    sidebarContainer.setAttribute('data-sidebar-pinned', String(isPinned));
    mainContent.setAttribute('data-sidebar-open', String(isOpen));
    mainContent.setAttribute('data-sidebar-pinned', String(isPinned));

    if (isOpen && !isPinned) {
      document.body.style.overflow = 'hidden';
      return;
    }

    if (document.body.classList.contains('hexa-docs-layout')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, isPinned, sidebarContainer, mainContent]);

  useEffect(() => {
    if (!sidebarContainer || !mainContent) {
      return;
    }

    const themeToggleRoot = document.querySelector('[class*="colorModeToggle"]') as HTMLElement | null;
    const themeToggleBtn = themeToggleRoot?.querySelector('button') as HTMLElement | null;
    themeToggleRoot?.classList.add('hexa-color-mode-toggle');
    themeToggleBtn?.classList.add('hexa-color-mode-toggle-btn');

    const navbarToggle = document.querySelector('.navbar__toggle') as HTMLButtonElement | null;
    const menu = sidebarContainer.querySelector('.menu') as HTMLElement | null;

    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    const handleMenuClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('a[href]')) {
        return;
      }
      if (!isPinned) {
        setIsOpen(false);
      }
    };

    const handleBackdropClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickedInsideSidebar = sidebarContainer.contains(target);
      const clickedToggle = Boolean(target.closest('.navbar__toggle'));
      if (!isPinned && !clickedInsideSidebar && !clickedToggle) {
        setIsOpen(false);
      }
    };

    navbarToggle?.addEventListener('click', handleToggle);
    menu?.addEventListener('click', handleMenuClick);
    mainContent.addEventListener('click', handleBackdropClick);

    return () => {
      navbarToggle?.removeEventListener('click', handleToggle);
      menu?.removeEventListener('click', handleMenuClick);
      mainContent.removeEventListener('click', handleBackdropClick);
    };
  }, [sidebarContainer, mainContent, isPinned]);

  const handlers = useMemo(() => {
    return {
      onClose: () => {
        if (!isPinned) {
          setIsOpen(false);
        }
      },
      onPin: (pinned: boolean) => {
        localStorage.setItem('docSidebarPinned', JSON.stringify(pinned));
        setIsPinned(pinned);
        setIsOpen(pinned ? true : isOpen);
      },
    };
  }, [isOpen, isPinned]);

  return { isPinned, portalHost, ...handlers };
}

export default function DocLayoutEnhancer() {
  const { pathname } = useLocation();
  const { isPinned, portalHost, onClose, onPin } = useDocSidebarState(pathname);

  return null;
}
