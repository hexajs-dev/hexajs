import { IsBoolean, IsNumber, IsOptional, IsString } from '@hexajs/common';
import { ClipVaultConfig } from './config';

export class ClipItem {
  @IsString() id: string;
  @IsString() text: string;
  @IsString() sourceUrl: string;
  @IsString() sourceDomain: string;
  @IsString() sourceElement: string;
  @IsNumber() capturedAt: number;
  @IsBoolean() sensitive: boolean;

  constructor(id: string, text: string, sourceUrl: string, sourceDomain: string, sourceElement: string, capturedAt: number, sensitive: boolean) {
    this.id = id;
    this.text = text;
    this.sourceUrl = sourceUrl;
    this.sourceDomain = sourceDomain;
    this.sourceElement = sourceElement;
    this.capturedAt = capturedAt;
    this.sensitive = sensitive;
  }
}

export class UpdateConfigMessage {
  config: Partial<ClipVaultConfig>;

  constructor(config: Partial<ClipVaultConfig>) {
    this.config = config;
  }
}

export class GetConfigMessage {
  @IsNumber() requestedAt: number;

  constructor(requestedAt: number) {
    this.requestedAt = requestedAt;
  }
}

export class ConfigResponseMessage {
  config: ClipVaultConfig;

  constructor(config: ClipVaultConfig) {
    this.config = config;
  }
}

export class AddClipMessage {
  clip: ClipItem;

  constructor(clip: ClipItem) {
    this.clip = clip;
  }
}

export class RemoveClipMessage {
  @IsString() clipId: string;

  constructor(clipId: string) {
    this.clipId = clipId;
  }
}

export class GetClipsMessage {
  @IsNumber() requestedAt: number;
  @IsOptional() @IsString() domain?: string;

  constructor(requestedAt: number, domain?: string) {
    this.requestedAt = requestedAt;
    this.domain = domain;
  }
}

export class ClipsResponseMessage {
  clips: ClipItem[];

  constructor(clips: ClipItem[]) {
    this.clips = clips;
  }
}

export class SyncClipsMessage {
  clips: ClipItem[];

  constructor(clips: ClipItem[]) {
    this.clips = clips;
  }
}

export class SyncConfigMessage {
  config: ClipVaultConfig;

  constructor(config: ClipVaultConfig) {
    this.config = config;
  }
}
