---
title: CommandsPort
description: API reference for CommandsPort in the background context.
---

import CommandsPortAPI from '../../reference-models/ports/background/commands/commands-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# CommandsPort

`CommandsPort` exposes the keyboard shortcut commands declared in the extension manifest and emits events when the user triggers them.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/commands/commands.port.ts`

## Key Methods

- `getAll(): Promise<WebExtCommand[]>` - List all registered keyboard commands.
- `onCommandAddListener(listener: (command: string) => void): void` - Subscribe to command events.
- `onCommandRemoveListener(listener: (command: string) => void): void` - Unsubscribe from command events.

## Usage

```typescript
import { CommandsPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class KeyboardShortcutService {
  constructor(private readonly commands: CommandsPort) {}

  registerHandlers() {
    this.commands.onCommandAddListener((command) => {
      if (command === 'toggle-feature') {
        this.handleToggle();
      }
    });
  }

  private handleToggle() {
    // dispatch toggle action to state manager
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <CommandsPortAPI />
</ApiReferenceAppendix>