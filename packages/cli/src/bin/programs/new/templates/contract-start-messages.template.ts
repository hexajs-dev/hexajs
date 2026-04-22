import type { ScaffoldContext } from '../models/scaffold.types';

export const contractStartMessagesTemplate = (_ctx: ScaffoldContext): string => `\
import { IsNumber, IsString } from '@hexajs/common';

export class ContentPingMessage {
  @IsString()
  message: string;

  @IsNumber()
  timestamp: number;

  constructor(message: string, timestamp: number) {
    this.message = message;
    this.timestamp = timestamp;
  }
}

export class ContentPongMessage {
  @IsString()
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class BackgroundPongMessage {
  @IsString()
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class BackgroundPingMessage {
  @IsString()
  message: string;

  @IsNumber()
  timestamp: number;

  constructor(message: string, timestamp: number) {
    this.message = message;
    this.timestamp = timestamp;
  }
}
`;