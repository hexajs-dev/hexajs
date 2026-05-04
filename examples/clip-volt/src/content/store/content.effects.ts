import { HexaContext, Injectable, inject } from '@hexajs-dev/common';
import { Actions, createEffect, ofType, select } from '@hexajs-dev/core';
import { map, withLatestFrom } from 'rxjs/operators';
import * as ContentActions from './content.actions';
import { ContentState } from './content.reducer';
import { HexaContentStore } from '@hexajs-dev/core';
import { ClipItem } from '../../contract/messages';
import { ClipVaultConfig } from '../../contract/config';

@Injectable({context: HexaContext.Content})
export class ContentEffects {
  private actions$ = inject(Actions);
  private store = inject(HexaContentStore<ContentState>);

  /**
   * Listen to clips or config updates and filter clips accordingly
   * Triggers whenever CLIPS_SYNCED or CONFIG_SYNCED actions are dispatched
   */
  filterClips$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContentActions.CLIPS_SYNCED, ContentActions.CONFIG_SYNCED),
      withLatestFrom(
        this.store.pipe(select(state => state.clips)),
        this.store.pipe(select(state => state.config))
      ),
      map(([, clips, config]) => {
        const filteredClips = this.applyFilters(clips.list, config);
        return ContentActions.clipsFiltered({ filteredClips });
      })
    )
  );

  /**
   * Apply filtering logic to clips based on config
   * - Domain scoping: if enabled, only show clips from current domain
   * - URL rules: apply include/exclude patterns
   * - Sensitive data: filter if sensitiveDetection is enabled
   * - Storage limits: respect maxItems limit
   * - Auto-expire: filter out expired clips if enabled
   */
  private applyFilters(clips: ClipItem[], config: ClipVaultConfig): ClipItem[] {
    if (!clips || clips.length === 0) {
      return [];
    }

    let filtered = [...clips];

    // 1. Domain scoping filter
    if (config.privacy.domainScoped) {
      const currentDomain = this.getCurrentDomain();
      filtered = filtered.filter(clip => clip.sourceDomain === currentDomain);
    }

    // 2. Apply URL rules (include/exclude)
    if (config.urlRules.exclude.length > 0) {
      filtered = this.applyUrlRules(filtered, config.urlRules);
    }

    // 3. Filter sensitive data if detection is enabled
    if (config.privacy.sensitiveDetection) {
      filtered = filtered.filter(clip => !clip.sensitive);
    }

    // 4. Remove expired clips if auto-expire is enabled
    if (config.privacy.autoExpire) {
      const expirationMs = config.privacy.autoExpireDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      filtered = filtered.filter(clip => now - clip.capturedAt < expirationMs);
    }

    // 5. Respect storage limits - keep most recent clips
    if (filtered.length > config.storage.maxItems) {
      filtered = filtered.slice(0, config.storage.maxItems);
    }

    // 6. Sort by most recent first
    filtered.sort((a, b) => b.capturedAt - a.capturedAt);

    return filtered;
  }

  /**
   * Get the current domain from window.location
   */
  private getCurrentDomain(): string {
    try {
      const url = new URL(window.location.href);
      return url.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Apply URL include/exclude rules to filter clips
   */
  private applyUrlRules(clips: ClipItem[], urlRules: any): ClipItem[] {
    return clips.filter(clip => {
      try {
        const clipDomain = new URL(clip.sourceUrl).hostname;

        // If exclude rules exist, filter out matching domains
        if (urlRules.exclude && urlRules.exclude.length > 0) {
          if (urlRules.exclude.some((rule: any) => clipDomain === rule.domain)) {
            return false;
          }
        }

        // If include rules exist, only allow matching domains
        if (urlRules.include && urlRules.include.length > 0) {
          return urlRules.include.some((rule: any) => clipDomain === rule.domain);
        }

        return true;
      } catch {
        return false;
      }
    });
  }
}
