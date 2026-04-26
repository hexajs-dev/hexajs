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
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

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
    this.close();
    if (this.isMounted) {
      this.unmount();
    }
  }

  closeOverlay(): void {
    this.close();
  }

  private open(): void {
    if (!this.isMounted) {
      this.mount();
    }
    this.keydownHandler = this.handleOverlayKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler, true);
  }

  private close(): void {
    this.unmount();
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }
  }

  private handleOverlayKeydown(event: KeyboardEvent): void {
    if (!this.isMounted) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }
}
