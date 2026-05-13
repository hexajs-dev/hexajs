import { Content, ContentRunAt, HexaContentClient, HexaContentStore, InjectView, select } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';
import { ContentState } from './store/content.reducer';
import { clipAdded, clipsSynced, configSynced } from './store/content.actions';
import { clipboardApi, configApi } from '../contract/api';
import { AddClipMessage, ClipsResponseMessage, ConfigResponseMessage, GetClipsMessage, GetConfigMessage } from '../contract/messages';
import { ClipboardCaptureService } from './services/clipboard-capture.service';
import { ClipboardOverlayView } from './ui/clipboard-overlay/clipboard-overlay.view';
import { LoggerService } from '../services/logger.service';
import { Subscription } from 'rxjs';
import { selectExcludedDomains } from './store/content.selectors';
import { UrlRule } from '@contract/config';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class ClipVaultContent implements OnInit, OnDestroy {
  @InjectView() overlay!: ClipboardOverlayView;
  private subscriptions = new Subscription();
  excludedDomains: Array<string> = [];

  constructor(private readonly store: HexaContentStore<ContentState>, private readonly client: HexaContentClient, private readonly captureService: ClipboardCaptureService, private readonly logger: LoggerService) {
    this.subscriptions.add(this.store.pipe(select(selectExcludedDomains)).subscribe(excludedDomains => {
      this.excludedDomains = (excludedDomains ?? [] as UrlRule[]).map(rule => rule.domain);
    }));
  }

  async onInit(): Promise<void> {
    document.addEventListener('copy', this.onCopy);
    this.overlay.start();
    await this.loadInitialState();
    this.logger.log('Content initialized');
  }

  onDestroy(): void {
    document.removeEventListener('copy', this.onCopy);
    this.overlay.dispose();
  }

  private async loadInitialState(): Promise<void> {
    try {
      const configResponse = await this.client.sendMessage<GetConfigMessage, ConfigResponseMessage>(configApi.Get, new GetConfigMessage(Date.now()));
      if (configResponse && !(configResponse as any).__hexa_error__ && configResponse.config) {
        this.store.dispatch(configSynced({ config: configResponse.config }));
      }
    } catch (err) {
      this.logger.warn('Failed to load config:', err);
    }
    try {
      const clipsResponse = await this.client.sendMessage<GetClipsMessage, ClipsResponseMessage>(clipboardApi.Get, new GetClipsMessage(Date.now()));
      if (clipsResponse && !(clipsResponse as any).__hexa_error__ && clipsResponse.clips) {
        this.store.dispatch(clipsSynced({ clips: clipsResponse.clips }));
      }
    } catch (err) {
      this.logger.warn('Failed to load clips:', err);
    }
  }

  private readonly onCopy = (event: ClipboardEvent): void => {
    if (this.isCurrentDomainExcluded(window.location.hostname)) {
      return;
    }
    const clip = this.captureService.captureFromCopyEvent(event);
    if (!clip) {
      return;
    }
    this.store.dispatch(clipAdded({ clip }));
    this.client.sendMessage<AddClipMessage, ClipsResponseMessage>(clipboardApi.Add, new AddClipMessage(clip)).catch(err => this.logger.error('Failed to send clip to background:', err));
  };

  private isCurrentDomainExcluded(hostname: string): boolean {
    const normalizedHostname = hostname.trim().toLowerCase();
    return this.excludedDomains.some(rule => this.matchesExcludedDomain(rule, normalizedHostname));
  }

  private matchesExcludedDomain(rule: string, hostname: string): boolean {
    const normalizedRule = rule.trim().toLowerCase();
    if (!normalizedRule || !hostname) {
      return false;
    }

    // Wildcard rule, e.g. *.github.com -> matches github.com and all subdomains.
    if (normalizedRule.startsWith('*.')) {
      const suffix = normalizedRule.substring(2);
      return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }

    // Exact hostname rule.
    if (hostname === normalizedRule) {
      return true;
    }

    // Support leading-dot suffix rules like .github.com.
    if (normalizedRule.startsWith('.')) {
      const suffix = normalizedRule.substring(1);
      return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }

    return false;
  }
}
