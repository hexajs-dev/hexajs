import { Controller, Action, HexaBackgroundClient, HexaBackgroundStore } from '@hexajs/core';
import { RuntimePort } from '@hexajs/ports';
import { configNamespace, ConfigActionsApi, clipboardNamespace, ClipboardActionsApi, clipboardHandlesApi } from '../contract/api';
import { UpdateConfigMessage, ConfigResponseMessage, GetConfigMessage, AddClipMessage, ClipsResponseMessage, GetClipsMessage, RemoveClipMessage, SyncClipsMessage, SyncConfigMessage } from '../contract/messages';
import { ConfigService } from './services/config.service';
import { ClipboardManagerService } from './services/clipboard-manager.service';
import { BackgroundState } from './store/background.reducer';
import { configLoaded, clipsUpdated } from './store/background.actions';
import { LoggerService } from '../services/logger.service';

@Controller({ namespace: configNamespace })
export class ClipVaultConfigController {
  constructor(private readonly client: HexaBackgroundClient, private readonly runtimePort: RuntimePort, private readonly configService: ConfigService, private readonly store: HexaBackgroundStore<BackgroundState>, private readonly logger: LoggerService) {}

  @Action(ConfigActionsApi.Get)
  async onGetConfig(_payload: GetConfigMessage): Promise<ConfigResponseMessage> {
    const config = await this.configService.loadConfig();
    return new ConfigResponseMessage(config);
  }

  @Action(ConfigActionsApi.Update)
  async onUpdateConfig(payload: UpdateConfigMessage): Promise<ConfigResponseMessage> {
    const current = await this.configService.loadConfig();
    const merged = this.configService.mergeConfig(current, payload.config);
    const syncMessage = new SyncConfigMessage(merged);
    await this.configService.saveConfig(merged);
    this.store.dispatch(configLoaded({ config: merged }));
    this.client.broadcast(clipboardHandlesApi.SyncConfig, syncMessage).catch(err => this.logger.error('Broadcast config failed:', err));
    this.runtimePort.sendMessage({ action: clipboardHandlesApi.SyncConfig, payload: syncMessage }).catch(err => this.logger.error('Runtime config sync failed:', err));
    return new ConfigResponseMessage(merged);
  } 
}

@Controller({ namespace: clipboardNamespace })
export class ClipVaultClipboardController {
  constructor(private readonly client: HexaBackgroundClient, private readonly clipboardManager: ClipboardManagerService, private readonly configService: ConfigService, private readonly store: HexaBackgroundStore<BackgroundState>, private readonly logger: LoggerService) {}

  @Action(ClipboardActionsApi.Add)
  async onAddClip(payload: AddClipMessage): Promise<ClipsResponseMessage> {
    const config = await this.configService.loadConfig();
    let clips = await this.clipboardManager.loadClips();
    clips = this.clipboardManager.addClip(clips, payload.clip, config.storage.maxItems);
    await this.clipboardManager.persistClips(clips);
    this.store.dispatch(clipsUpdated({ clips }));
    this.client.broadcast(clipboardHandlesApi.SyncClips, new SyncClipsMessage(clips)).catch(err => this.logger.error('Broadcast clips failed:', err));
    return new ClipsResponseMessage(clips);
  }

  @Action(ClipboardActionsApi.Get)
  async onGetClips(_payload: GetClipsMessage): Promise<ClipsResponseMessage> {
    const clips = await this.clipboardManager.loadClips();
    return new ClipsResponseMessage(clips);
  }

  @Action(ClipboardActionsApi.Remove)
  async onRemoveClip(payload: RemoveClipMessage): Promise<ClipsResponseMessage> {
    let clips = await this.clipboardManager.loadClips();
    clips = this.clipboardManager.removeClip(clips, payload.clipId);
    await this.clipboardManager.persistClips(clips);
    this.store.dispatch(clipsUpdated({ clips }));
    this.client.broadcast(clipboardHandlesApi.SyncClips, new SyncClipsMessage(clips)).catch(err => this.logger.error('Broadcast clips failed:', err));
    return new ClipsResponseMessage(clips);
  }
}
