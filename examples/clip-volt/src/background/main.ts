import { Background, HexaBackgroundStore } from '@hexajs/core';
import { OnInit, OnDestroy } from '@hexajs/common';
import { BackgroundState } from './store/background.reducer';
import { ConfigService } from './services/config.service';
import { ClipboardManagerService } from './services/clipboard-manager.service';
import { configLoaded, clipsUpdated } from './store/background.actions';
import { LoggerService } from '../services/logger.service';

const TTL_CHECK_INTERVAL = 5 * 60 * 1000;

@Background()
export class ClipVoltBackground implements OnInit, OnDestroy {
  private ttlTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly store: HexaBackgroundStore<BackgroundState>, private readonly configService: ConfigService, private readonly clipboardManager: ClipboardManagerService, private readonly logger: LoggerService) {}

  async onInit(): Promise<void> {
    console.log('Initializing background...');
    const config = await this.configService.loadConfig();
    this.store.dispatch(configLoaded({ config }));
    const clips = await this.clipboardManager.loadClips();
    const cleaned = this.clipboardManager.removeExpired(clips, config.privacy.autoExpire, config.privacy.autoExpireDays);
    if (cleaned.length !== clips.length) {
      await this.clipboardManager.persistClips(cleaned);
    }
    this.store.dispatch(clipsUpdated({ clips: cleaned }));
    this.ttlTimer = setInterval(() => this.cleanupExpired(), TTL_CHECK_INTERVAL);
    this.logger.log('Background initialized');
  }

  private async cleanupExpired(): Promise<void> {
    const config = await this.configService.loadConfig();
    if (!config.privacy.autoExpire) {
      return;
    }
    const clips = await this.clipboardManager.loadClips();
    const cleaned = this.clipboardManager.removeExpired(clips, true, config.privacy.autoExpireDays);
    if (cleaned.length !== clips.length) {
      await this.clipboardManager.persistClips(cleaned);
      this.store.dispatch(clipsUpdated({ clips: cleaned }));
      this.logger.log(`TTL cleanup: removed ${clips.length - cleaned.length} expired clips`);
    }
  }

  onDestroy(): void {
    if (this.ttlTimer) {
      clearInterval(this.ttlTimer);
      this.ttlTimer = null;
    }
  }
}
