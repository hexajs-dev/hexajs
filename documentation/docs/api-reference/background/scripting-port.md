---
title: ScriptingPort
description: API reference for ScriptingPort in the background context.
---

import ScriptingPortAPI from '../../reference-models/ports/background/scripting/scripting-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# ScriptingPort

`ScriptingPort` programmatically injects scripts into browser tabs at runtime, replacing the legacy `executeScript` approach with the MV3-compliant `scripting` API.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/scripting/scripting.port.ts`

## Key Methods

- `executeScript(options: ScriptingExecuteOptions): Promise<void>` - Inject script files into a target tab.

## Usage

```typescript
import { ScriptingPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class ContentInjectorService {
  constructor(private readonly scripting: ScriptingPort) {}

  async injectIntoTab(tabId: number) {
    await this.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['content/injected.js'],
    });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <ScriptingPortAPI />
</ApiReferenceAppendix>