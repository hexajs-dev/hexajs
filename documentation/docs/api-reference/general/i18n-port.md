---
title: I18nPort
description: API reference for I18nPort in the general context.
---

import I18nPortAPI from '../../reference-models/ports/general/i18n/i18n-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# I18nPort

`I18nPort` provides access to the extension's localization system, resolving message keys from `_locales` bundles and exposing the active browser language.

## Context

- **Availability:** Universal
- **Source:** `packages/ports/src/general/i18n/i18n.port.ts`

## Key Methods

- `getMessage(messageName: string, substitutions?: string | string[]): string` - Look up a localized string by key.
- `getUILanguage(): string` - Get the browser's current UI language code.
- `getAcceptLanguages(): Promise<string[]>` - Get the user's preferred language list.

## Usage

```typescript
import { I18nPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class LocalizationService {
  constructor(private readonly i18n: I18nPort) {}

  getWelcomeMessage(username: string): string {
    return this.i18n.getMessage('welcome_user', username);
  }

  async isEnglishUI(): Promise<boolean> {
    const langs = await this.i18n.getAcceptLanguages();
    return langs.some((lang) => lang.startsWith('en'));
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <I18nPortAPI />
</ApiReferenceAppendix>