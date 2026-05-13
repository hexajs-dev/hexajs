import { View, HexaView } from '@hexajs-dev/core';
import { OnDestroy } from '@hexajs-dev/common';
import { ClipboardOverlayComponent } from './clipboard-overlay.component';
import styles from './clipboard-overlay.scss?inline';
import { ClipItem } from '../../../contract/messages';

export interface ClipboardOverlayState {
  visible: boolean;
  searchQuery: string;
  selectedIndex: number;
  clips: ClipItem[];
  filteredClips: ClipItem[];
  theme: 'light' | 'dark';
}

@View({
  id: 'clip-vault-overlay',
  component: ClipboardOverlayComponent,
  styles,
  anchorSelector: 'body',
})
export class ClipboardOverlayView extends HexaView implements OnDestroy {
  private started = false;
  private readonly documentKeydownHandler = (event: KeyboardEvent): void => {
    if (this.isToggleShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
      return;
    }

    if (!this.isMounted) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  };

  start(): void {
    if (this.started) {
      return;
    }

    document.addEventListener('keydown', this.documentKeydownHandler);
    this.started = true;
  }

  onDestroy(): void {
    this.dispose();
  }

  toggle(): void {
    if (this.isMounted) {
      this.close();
    } else {
      this.open();
    }
  }

  dispose(): void {
    if (this.started) {
      document.removeEventListener('keydown', this.documentKeydownHandler);
      this.started = false;
    }

    this.close();
  }

  closeOverlay(): void {
    this.close();
  }

  private open(): void {
    if (!this.isMounted) {
      this.mount();
    }
  }

  private close(): void {
    if (this.isMounted) {
      this.unmount();
    }
  }

  private isToggleShortcut(event: KeyboardEvent): boolean {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    return modifier && event.shiftKey && event.key.toLowerCase() === 'l';
  }
}
