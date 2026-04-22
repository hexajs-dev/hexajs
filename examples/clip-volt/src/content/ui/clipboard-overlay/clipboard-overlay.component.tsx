import React, { useEffect, useMemo, useRef, useState } from 'react';
import { inject } from '@hexajs/common';
import { HexaContentStore, select } from '@hexajs/core';
import { Check, Clock3, CornerDownLeft, Globe, Search, X } from 'lucide-react';
import { ClipItem } from '../../../contract/messages';
import { ContentState } from '../../store/content.reducer';
import { selectFilteredClips, selectTheme } from '../../store/content.selectors';
import { ClipboardOverlayView } from './clipboard-overlay.view';

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `about ${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function maskText(text: string): string {
  if (text.length <= 12) return '*'.repeat(text.length);
  return `${text.substring(0, 6)}${'*'.repeat(Math.min(text.length - 12, 20))}${text.substring(text.length - 6)}`;
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max) + '...';
}

function buildClipSearchIndex(clip: ClipItem): string {
  const visibleText = clip.text || '';
  const maskedText = clip.sensitive ? maskText(visibleText) : '';
  const searchableParts = [
    clip.id || '',
    visibleText,
    maskedText,
    clip.sourceDomain || '',
    clip.sourceUrl || '',
    clip.sourceElement || '',
    String(clip.capturedAt || ''),
    formatTimeAgo(clip.capturedAt),
  ];
  return searchableParts.join(' ').toLowerCase();
}

async function writeToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fallback below
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function ClipItemRow({ clip, isSelected, isCopied, onHover, onCopy, rowRef }: { clip: ClipItem; isSelected: boolean; isCopied: boolean; onHover: () => void; onCopy: () => void; rowRef: (el: HTMLButtonElement | null) => void }): JSX.Element {
  const displayText = clip.sensitive ? maskText(clip.text) : clip.text;
  return (
    <button ref={rowRef} className={`cv-overlay__item${isSelected ? ' cv-overlay__item--selected' : ''}`} onMouseEnter={onHover} onClick={onCopy} role="option" aria-selected={isSelected} type="button">
      <div className="cv-overlay__item-text">{truncateText(displayText, 120)}</div>
      <div className="cv-overlay__item-meta">
        <span className="cv-overlay__item-domain">
          <Globe className="cv-overlay__globe" size={12} strokeWidth={1.9} />
          {clip.sourceDomain}
        </span>
        <span className="cv-overlay__item-sep">&middot;</span>
        <span className="cv-overlay__item-time">
          <Clock3 className="cv-overlay__clock" size={12} strokeWidth={1.9} />
          {formatTimeAgo(clip.capturedAt)}
        </span>
        <span className="cv-overlay__item-sep">&middot;</span>
        <span className="cv-overlay__item-tag">{clip.sourceElement}</span>
      </div>
      {isCopied ? (
        <div className="cv-overlay__item-copied" aria-label="Copied">
          <Check size={14} strokeWidth={2.3} />
        </div>
      ) : isSelected ? (
        <div className="cv-overlay__item-copy-icon" aria-label="Copy">
          <CornerDownLeft size={12} strokeWidth={2.2} />
        </div>
      ) : null}
    </button>
  );
}

export function ClipboardOverlayComponent({ controller }: { controller: ClipboardOverlayView }): JSX.Element | null {
  const store = inject(HexaContentStore<ContentState>);
  const [filteredClips, setFilteredClips] = useState<ClipItem[]>([]);
  const [theme, setTheme] = useState<string>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);


  useEffect(() => {
    const subscription = store.pipe(select(selectFilteredClips)).subscribe(filteredClipts => {
      setFilteredClips(filteredClipts);
    });
    return () => subscription.unsubscribe();
  }, [store]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    return () => {
      window.clearTimeout(timeout);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const displayClips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return filteredClips;
    }
    return filteredClips.filter(clip => buildClipSearchIndex(clip).includes(query));
  }, [filteredClips, searchQuery]);

  useEffect(() => {
    const subscription = store.pipe(select(selectTheme)).subscribe(theme => {
      setTheme(theme ?? 'light');
    });
    return () => subscription.unsubscribe();
  }, [store]);

  useEffect(() => {
    setSelectedIndex(0);
    setCopiedId(null);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedIndex(prev => {
      if (displayClips.length === 0) {
        return 0;
      }
      return Math.min(prev, displayClips.length - 1);
    });
  }, [displayClips]);

  useEffect(() => {
    if (displayClips.length === 0) {
      return;
    }
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, displayClips.length]);

  const closeAfterCopy = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      controller.closeOverlay();
    }, 300);
  };

  const copyClip = async (clip: ClipItem, index: number) => {
    setSelectedIndex(index);
    await writeToClipboard(clip.text);
    setCopiedId(clip.id);
    closeAfterCopy();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      controller.closeOverlay();
      return;
    }

    if (displayClips.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(index => Math.min(index + 1, displayClips.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(index => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selectedClip = displayClips[selectedIndex];
      if (selectedClip) {
        void copyClip(selectedClip, selectedIndex);
      }
    }
  };

  return (
    <div className={`cv-overlay cv-overlay--${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="cv-overlay__backdrop" onMouseDown={() => controller.closeOverlay()} />
      <div className="cv-overlay__panel" onKeyDown={handleKeyDown} role="dialog" aria-modal="true" aria-label="Clipboard overlay" tabIndex={-1}>
        <div className="cv-overlay__search-bar">
          <Search className="cv-overlay__search-icon" size={20} strokeWidth={2.1} />
          <input ref={inputRef} value={searchQuery} className="cv-overlay__search-input" type="text" placeholder="Search your clips..." onChange={(e) => setSearchQuery(e.target.value)} />
          <button className="cv-overlay__close-btn" onClick={() => controller.closeOverlay()} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
        <div className="cv-overlay__list" role="listbox">
          {displayClips.length === 0 ? (
            <div className="cv-overlay__empty">No clips found</div>
          ) : (
            displayClips.map((clip, index) => (
              <ClipItemRow key={clip.id} clip={clip} isSelected={index === selectedIndex} isCopied={copiedId === clip.id} onHover={() => setSelectedIndex(index)} onCopy={() => void copyClip(clip, index)} rowRef={(el) => { itemRefs.current[index] = el; }} />
            ))
          )}
        </div>
        <div className="cv-overlay__footer">
          <span className="cv-overlay__shortcut"><kbd>↑↓</kbd> navigate</span>
          <span className="cv-overlay__shortcut"><kbd>↵</kbd> copy</span>
          <span className="cv-overlay__shortcut"><kbd>esc</kbd> close</span>
          <span className="cv-overlay__count">{displayClips.length} clip{displayClips.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
