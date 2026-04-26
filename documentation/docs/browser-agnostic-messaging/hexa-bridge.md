---
title: Bridged Routing
sidebar_position: 2
description: Background acts as the central abstraction layer between browser APIs and isolated UI/content contexts.
---

import ControllerDecoratorsAPI from '../reference-models/core/background/controller/decorators.md';
import HandlerDecoratorsAPI from '../reference-models/core/content/handler/decorators.md';
import HexaClientBaseAPI from '../reference-models/core/services/hexa-client-base.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Bridged Routing

In modern browser extension development, code is inherently fractured across isolated sandboxes: UI Popups, Content Scripts, and Background Service Workers. Furthermore, the underlying browser APIs (Chrome, Firefox, Safari) are highly fragmented. 

HexaJS addresses these environment constraints using a pattern called **Bridged Routing**. 

Instead of scattering `chrome.runtime.sendMessage` and platform-specific `if/else` checks throughout the application, HexaJS treats the background script as a central hub, and the UI/Content scripts as clients communicating over a type-safe message bus.

## The Architecture

Bridged Routing consists of three distinct layers:

1. **The Client (UI / Content Scripts):** Isolated from browser APIs. They request data by dispatching typed actions.
2. **The Controller (Background):** Receives actions, handles business logic, and delegates browser-level work to Ports.
3. **The Port (Platform Adapter):** Platform-specific implementations that wrap native browser APIs into a standardized, Promise-based interface.

> **Core Rule:** UI components and Content and Background Scripts should never call browser APIs directly. All browser-level operations must be routed through @Ports.
## The Problem: API Fragmentation

Without an abstraction layer, supporting multiple browsers leads to code heavily reliant on platform checks. Chrome relies on callbacks, Firefox uses Promises, and Safari often requires proprietary APIs:

```typescript
// ❌ The old way: Scattered platform checks
function getActiveTab() {
  if (isChrome) {
    chrome.tabs.query({ active: true }, (tabs) => handle(tabs));
  } else if (isFirefox) {
    browser.tabs.query({ active: true }).then((tabs) => handle(tabs));
  } else if (isSafari) {
    const tab = safari.application.activeBrowserWindow.activeTab;
    handle([tab]);
  }
}
```

## The HexaJS Solution: Ports & Controllers

HexaJS abstracts platform specifics into **Ports**. Application logic relies strictly on Dependency Injection to access browser capabilities.

### 1. The Client Request (UI Context)
UI components use the `HexaUIClient` to trigger an action on the background script, agnostic to the browser environment.

```ts
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';

const uiClient = inject(HexaUIClient);

const result = await uiClient.sendMessage('tabInfo:current', {});
console.log('Active tab metadata:', result);
```

### 2. The Background Controller
The Controller listens for the `'tabInfo:current'` action. It injects the necessary **Ports** to execute the browser API calls.

```ts
import { Controller, Action } from '@hexajs-dev/core';
import { TabsPort, StoragePort } from '@hexajs-dev/ports';

@Controller({ namespace: 'tabInfo' })
export class TabInfoController {
  constructor(private readonly tabsPort: TabsPort, private readonly storagePort: StoragePort) {}

  @Action('current')
  async onGetCurrentTabInfo(): Promise<{ tabId: number; url: string; metadata?: unknown }> {
    const [activeTab] = await this.tabsPort.query({ active: true });
    if (!activeTab) throw new Error('No active tab found');

    const cached = await this.storagePort.get('tabMetadata', { [activeTab.id]: {} });
    return {
      tabId: activeTab.id,
      url: activeTab.url,
      metadata: cached[activeTab.id] ?? {},
    };
  }
}
```

## Benefits

* **Predictable Architecture:** Clear separation between business logic (Controllers) and UI state (Clients).
* **Cross-Platform Compatibility:** Controller logic is written once; changing the build platform swaps the underlying Port implementation.
* **Testability:** Components rely on Dependency Injection, allowing Ports like `TabsPort` or `StoragePort` to be mocked in unit tests.
* **Security:** Sensitive browser APIs are restricted to the Background script, minimizing the attack surface in Content Scripts and UI environments.

<ApiReferenceAppendix>
<ControllerDecoratorsAPI />

<HandlerDecoratorsAPI />

<HexaClientBaseAPI />
</ApiReferenceAppendix>