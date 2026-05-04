import { afterEach, describe, expect, it, vi } from 'vitest';
import { map, mergeMap } from 'rxjs';
import { HttpHexaClient } from '../src/services/http-hexa-client.service';
import { Actions, ActionsSubject, createEffect, ofType, subscribeEffects } from '../src/store';
import { HttpHexaClientResponseLike } from '../src/services/http-hexa-client.service';

interface MockResponseOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
  body?: unknown;
}

const runtimeGlobal = globalThis as typeof globalThis & { fetch?: (...args: unknown[]) => Promise<HttpHexaClientResponseLike> };

function createResponse(options: MockResponseOptions = {}): HttpHexaClientResponseLike {
  const body = options.body;

  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    url: 'https://api.test/items',
    text: async () => JSON.stringify(body ?? {}),
    json: async () => body,
  };
}

class LoadItemsEffectService {
  readonly loadItems$;

  constructor(private readonly actions$: Actions, private readonly httpClient: HttpHexaClient) {
    this.loadItems$ = createEffect(() => {
      return this.actions$.pipe(
        ofType('items/load'),
        mergeMap(() => {
          return this.httpClient.get<{ items: string[] }>('https://api.test/items').pipe(
            map((response) => ({ type: 'items/loaded', payload: response.items })),
          );
        }),
      );
    });
  }
}

describe('effect + HttpHexaClient integration', () => {
  const originalFetch = runtimeGlobal.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    runtimeGlobal.fetch = originalFetch;
  });

  it('dispatches response actions from an effect that calls HttpHexaClient', async () => {
    runtimeGlobal.fetch = vi.fn().mockResolvedValue(createResponse({ body: { items: ['one', 'two'] } }));

    const actionsSubject = new ActionsSubject();
    const actions$ = new Actions(actionsSubject);
    const service = new LoadItemsEffectService(actions$, new HttpHexaClient());
    const dispatched: Array<{ type: string; payload?: unknown }> = [];

    const subscriptions = subscribeEffects(service, (action) => {
      dispatched.push(action);
    });

    actionsSubject.next({ type: 'items/load', payload: undefined });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dispatched).toContainEqual({ type: 'items/loaded', payload: ['one', 'two'] });

    subscriptions.unsubscribe();
  });
});
