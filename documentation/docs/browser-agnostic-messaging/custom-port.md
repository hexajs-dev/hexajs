---
title: Custom Ports
sidebar_position: 3
description: Create custom ports for browser APIs not exposed in @hexajs-dev/ports by implementing platform-aware abstractions.
---

import DiDecoratorsAPI from '../reference-models/common/di/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Custom Ports

The browser API landscape differs significantly across Chrome, Firefox, Safari, Edge, Opera, and Brave. HexaJS abstracts these differences into **Ports**—injectable services that route platform-specific calls through a unified, Promise-based interface.

While HexaJS provides many built-in Ports (like `TabsPort` and `StoragePort`), you may need to interact with a specific browser API or integrate with native companion apps. In these cases, you can author your own Custom Port.

## Why Custom Ports Matter

Without a Port abstraction, application code quickly becomes coupled to specific browsers, leading to scattered `if (isChrome)` statements and repeated checks across your Background, Content, and UI scripts.

By building a Custom Port, you ensure that:
1. **Application code stays clean:** Your Controllers and UI components simply import the Port and call its methods.
2. **Platform logic is isolated:** The messy details of API differences are contained entirely within the Port's implementation.
3. **Native Integrations:** You can seamlessly bridge web extension code with native companion apps (e.g., Swift for macOS/Safari) behind a standard interface.

## Building a Custom Port

Let's build a `NotificationPort`. This is a great example because Chrome and Firefox have built-in notification APIs, but Safari often requires sending a message to a native Swift companion app to trigger a macOS system notification.

### 1. Define the Port

A custom Port is simply an `@Injectable` class that checks the injected platform token and executes the correct native API or messaging protocol.

```ts
import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '@hexajs-dev/ports';

export interface NotificationOptions {
  iconUrl?: string;
}

@Injectable({ context: HexaContext.Background })
export class NotificationPort {
  constructor(@Inject(HEXA_PLATFORM) private readonly platform: string) {}

  notify(title: string, message: string, options?: NotificationOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const notificationId = `hexa-notification-${Date.now()}`;

      switch (this.platform) {
        
        case PlatformType.Firefox: {
          const browserApi = (globalThis as any).browser;
          if (!browserApi?.notifications) {
            return reject(new Error(`Notifications not supported on ${this.platform}`));
          }
          
          browserApi.notifications.create(notificationId, {
            type: 'basic',
            title,
            message,
            iconUrl: options?.iconUrl,
          })
          .then(() => resolve(notificationId))
          .catch(reject);
          break;
        }

        case PlatformType.Safari: {
          // Safari requires communicating with the native Swift companion app
          const browserApi = (globalThis as any).browser;
          
          browserApi.runtime.sendNativeMessage('com.yourcompany.safari.companion', {
            action: 'triggerNotification',
            payload: { title, message }
          })
          .then(() => resolve(notificationId))
          .catch(reject);
          break;
        }

        case PlatformType.Chrome:
        case PlatformType.Edge:
        case PlatformType.Opera:
        case PlatformType.Brave:
        default: {
          const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
          if (!chromeApi?.notifications) {
             return reject(new Error(`Notifications not supported on ${this.platform}`));
          }
          
          chromeApi.notifications.create(notificationId, {
            type: 'basic',
            title,
            message,
            iconUrl: options?.iconUrl,
          }, () => resolve(notificationId));
          break;
        }
      }
    });
  }
}
```

### 2. Key Implementation Details

When writing your own Ports, adhere to these patterns to ensure they work correctly within the HexaJS architecture:

* **The Platform Token:** Always use the injected `this.platform` token to determine the current execution environment. HexaJS guarantees this token is populated accurately based on your build target.
* **Dynamic Globals:** **Do not** cache `globalThis.chrome` or `globalThis.browser` as class properties in your constructor. Always access them dynamically inside the specific `case` block. Different browser environments can reset or restrict these globals based on the execution context.
* **Fail Gracefully:** Always check if the specific API exists before calling it, and explicitly reject the Promise if it is missing.

### 3. Using the Custom Port

Once defined, your Custom Port functions exactly like the built-in Ports. You can inject it directly into a Background Controller to trigger notifications based on incoming messages.

```ts
import { Controller, Action } from '@hexajs-dev/core';
import { NotificationPort } from '../ports/notification.port';

@Controller({ namespace: 'alerts' })
export class NotificationController {
  constructor(private readonly notificationPort: NotificationPort) {}

  @Action('show')
  async onShowAlert(payload: { title: string; message: string }) {
    // Calling the port abstractly; Safari delegates to Swift, Chrome uses native APIs
    const id = await this.notificationPort.notify(payload.title, payload.message, {
      iconUrl: 'assets/icon-48.png',
    });
    
    return { success: true, id };
  }
}
```

## Built-In Ports Reference

Before building a Custom Port, check if HexaJS already provides an abstraction for your needs in the `@hexajs-dev/ports` package:

| Port | Primary Context | Purpose |
| :--- | :--- | :--- |
| `RuntimePort` | Universal | Base messaging, extension lifecycle, and manifest data. |
| `TabsPort` | Background | Querying tabs, sending messages to specific tabs. |
| `StoragePort` | Background | Persisting and syncing extension state. |
| `DevtoolsPort` | UI | Registering and interacting with custom DevTools panels. |
| `ScriptingPort` | Background | Executing dynamic scripts in the page context (Manifest V3). |

## Best Practices Checklist

* **DO** rely on the `@Inject(HEXA_PLATFORM)` token for environment checks.
* **DO** use the `PlatformType.*` enums instead of hardcoded strings.
* **DO** keep each method's `switch` statement focused on a single capability.
* **DON'T** cache browser globals (`chrome` or `browser`) in class properties.

<ApiReferenceAppendix>
<DiDecoratorsAPI />
</ApiReferenceAppendix>