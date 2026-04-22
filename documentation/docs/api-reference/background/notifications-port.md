---
title: NotificationsPort
description: API reference for NotificationsPort in the background context.
---

import NotificationsPortAPI from '../../reference-models/ports/background/notifications/notifications-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# NotificationsPort

`NotificationsPort` displays and manages OS-level browser notifications, including rich notifications with buttons and progress indicators.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/notifications/notifications.port.ts`

## Key Methods

- `create(options: WebExtNotificationOptions): Promise<string>` - Show a notification, returns its ID.
- `create(notificationId: string, options: WebExtNotificationOptions): Promise<string>` - Show a notification with an explicit ID.
- `clear(notificationId: string): Promise<boolean>` - Dismiss a notification.
- `getAll(): Promise<{ [notificationId: string]: boolean }>` - List all active notifications.
- `onClickedAddListener(listener: (notificationId: string) => void): void` - Subscribe to notification click events.
- `onClickedRemoveListener(listener: (notificationId: string) => void): void` - Unsubscribe from click events.
- `onClosedAddListener(listener: (notificationId: string, byUser: boolean) => void): void` - Subscribe to notification close events.

## Usage

```typescript
import { NotificationsPort } from '@hexajs/ports';
import { Injectable, InjectableContext } from '@hexajs/common';

@Injectable({ context: InjectableContext.Background })
export class DownloadNotificationService {
  constructor(private readonly notifications: NotificationsPort) {}

  async notifyDownloadComplete(filename: string) {
    const id = await this.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Download complete',
      message: `${filename} is ready.`,
    });
    this.notifications.onClickedAddListener((notificationId) => {
      if (notificationId === id) {
        this.notifications.clear(id);
      }
    });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <NotificationsPortAPI />
</ApiReferenceAppendix>