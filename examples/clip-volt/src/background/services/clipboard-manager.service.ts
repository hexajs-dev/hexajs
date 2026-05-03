import { Injectable, HexaContext } from '@hexajs-dev/common';
import { StoragePort } from '@hexajs-dev/ports';
import { CLIPS_STORAGE_KEY } from '../../contract/config';
import { ClipItem } from '../../contract/messages';

@Injectable({ context: HexaContext.Background })
export class ClipboardManagerService {
  constructor(private readonly storagePort: StoragePort) {}

  async loadClips(): Promise<ClipItem[]> {
    const result = await this.storagePort.get('local', CLIPS_STORAGE_KEY);
    const stored = result[CLIPS_STORAGE_KEY];
    return Array.isArray(stored) ? stored : [];
  }

  async persistClips(clips: ClipItem[]): Promise<void> {
    await this.storagePort.set('local', { [CLIPS_STORAGE_KEY]: clips });
  }

  addClip(clips: ClipItem[], clip: ClipItem, maxItems: number): ClipItem[] {
    const updated = [clip, ...clips.filter(c => c.id !== clip.id)];
    return updated.slice(0, maxItems);
  }

  removeClip(clips: ClipItem[], clipId: string): ClipItem[] {
    return clips.filter(c => c.id !== clipId);
  }

  removeExpired(clips: ClipItem[], autoExpire: boolean, autoExpireDays: number): ClipItem[] {
    if (!autoExpire) {
      return clips;
    }
    const cutoff = Date.now() - autoExpireDays * 24 * 60 * 60 * 1000;
    return clips.filter(c => c.capturedAt >= cutoff);
  }
}
