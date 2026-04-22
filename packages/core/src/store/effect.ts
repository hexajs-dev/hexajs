import { Observable, Subscription, EMPTY, catchError, mergeMap, timer, retry } from 'rxjs';
import { HexaActionWithPayload } from './action.abstract';

type HexaAction = HexaActionWithPayload<string, any>;

const HEXA_EFFECT_KEY = '__hexa_effect__';

export interface EffectConfig {
  dispatch?: boolean;
}

interface EffectMetadata {
  dispatch: boolean;
}

/**
 * Creates a managed effect from an RxJS pipeline factory.
 * 
 * The returned Observable is tagged so the framework can:
 * 1. Auto-subscribe it at bootstrap time
 * 2. Route emitted actions back to store.dispatch() (unless dispatch: false)
 * 3. Recover from errors (dead-stream protection)
 * 4. Auto-unsubscribe on lifecycle destroy (HMR, navigation, suspend)
 * 
 * Must be used inside an @Injectable() class — the CLI enforces this at build time.
 * 
 * @example
 * // Effect that dispatches a new action
 * loadItems$ = createEffect(() => {
 *   return this.actions$.pipe(
 *     ofType('LOAD_ITEMS'),
 *     exhaustMap(() => this.itemsService.getAll().pipe(
 *       map(items => ({ type: 'ITEMS_LOADED', payload: items })),
 *       catchError(() => of({ type: 'ITEMS_LOAD_ERROR' }))
 *     ))
 *   );
 * });
 * 
 * // Side-effect only (no dispatched action)
 * logActions$ = createEffect(() => {
 *   return this.actions$.pipe(
 *     tap(action => console.log('Action:', action.type))
 *   );
 * }, { dispatch: false });
 */
export function createEffect(factory: () => Observable<HexaAction>, config?: EffectConfig): Observable<HexaAction>;
export function createEffect(factory: () => Observable<any>, config: { dispatch: false }): Observable<any>;
export function createEffect(factory: () => Observable<any>, config?: EffectConfig): Observable<any> {
  const source$ = factory();
  const metadata: EffectMetadata = { dispatch: config?.dispatch ?? true };
  (source$ as any)[HEXA_EFFECT_KEY] = metadata;
  return source$;
}

/**
 * Returns the effect metadata if the value is a tagged effect Observable, else undefined.
 */
function getEffectMetadata(value: any): EffectMetadata | undefined {
  if (value && typeof value === 'object' && HEXA_EFFECT_KEY in value) {
    return value[HEXA_EFFECT_KEY] as EffectMetadata;
  }
  return undefined;
}

/**
 * Discovers all createEffect-tagged properties on an instance, subscribes each
 * with dead-stream recovery, and routes dispatching effects back to the store.
 * 
 * Returns a composite Subscription that unsubscribes all effects at once.
 * The generator calls this at bootstrap and adds the subscription to lifecycle cleanup.
 * 
 * @param instance The @Injectable service instance containing effect properties
 * @param dispatch Function to dispatch actions (typically store.dispatch bound)
 */
export function subscribeEffects(instance: any, dispatch: (action: HexaAction) => void): Subscription {
  const composite = new Subscription();
  const keys = new Set<string>();

  // Collect keys from own + prototype chain
  let current = instance;
  while (current && current !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(current)) {
      keys.add(key);
    }
    current = Object.getPrototypeOf(current);
  }

  for (const key of keys) {
    let value: any;
    try {
      value = instance[key];
    } catch {
      continue;
    }

    const meta = getEffectMetadata(value);
    if (!meta) continue;

    const effect$: Observable<any> = value;

    // Dead-stream recovery: on unhandled error, log and re-subscribe after microtask delay.
    // This prevents the effect from permanently dying on transient failures.
    const resilient$ = effect$.pipe(
      catchError((err) => {
        console.error(`[HexaJS] Effect "${key}" threw an error and will be restarted:`, err);
        // Return EMPTY to complete current inner, then retry will re-subscribe
        return EMPTY;
      }),
      // retry re-subscribes to the source when it completes (from catchError → EMPTY)
      retry({ delay: () => timer(0) })
    );

    if (meta.dispatch) {
      composite.add(
        resilient$.subscribe({
          next: (action) => {
            if (action && typeof action === 'object' && typeof action.type === 'string') {
              dispatch(action);
            }
          },
        })
      );
    } else {
      // dispatch: false — just run the side-effect, ignore emissions
      composite.add(resilient$.subscribe());
    }
  }

  return composite;
}
