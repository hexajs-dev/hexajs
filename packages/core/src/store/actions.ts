import { Observable, Subject, filter, OperatorFunction } from 'rxjs';
import { HexaActionWithPayload } from './action.abstract';
import { Injectable } from '@hexajs/common';

type HexaAction = HexaActionWithPayload<string, any>;

/**
 * Internal writable action stream — used only by the store's dispatch method.
 * NOT exposed to user code; the generator registers it in the DI container.
 */
export class ActionsSubject extends Subject<HexaAction> {}

/**
 * Public read-only action stream — injected by user services and effects.
 * 
 * Extends Observable so TypeScript prevents calling .next(), .error(), .complete().
 * 
 * @example
 * private readonly actions$ = inject(Actions);
 * 
 * // ✅ Works — pipe and subscribe are Observable methods
 * this.actions$.pipe(ofType('INCREMENT')).subscribe(action => { ... });
 * 
 * // ❌ TypeScript Error — .next() does not exist on Observable
 * this.actions$.next({ type: 'ILLEGAL' });
 */
@Injectable()
export class Actions extends Observable<HexaAction> {
  constructor(source: ActionsSubject) {
    super((subscriber) => {
      return source.subscribe(subscriber);
    });
  }
}

/**
 * RxJS operator that filters actions by one or more action types.
 * 
 * @example
 * this.actions$.pipe(
 *   ofType('INCREMENT', 'DECREMENT'),
 *   map(action => { ... })
 * );
 * 
 * // Also works with createAction type property:
 * this.actions$.pipe(
 *   ofType(increment.type, decrement.type)
 * );
 */
export function ofType(...allowedTypes: string[]): OperatorFunction<HexaAction, HexaAction> {
  return filter((action: HexaAction) => allowedTypes.includes(action.type));
}
