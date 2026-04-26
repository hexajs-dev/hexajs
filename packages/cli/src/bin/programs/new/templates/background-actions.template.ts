import type { ScaffoldContext } from '../models/scaffold.types';

export const backgroundActionsTemplate = (_ctx: ScaffoldContext): string => `\
import { createAction, props } from '@hexajs-dev/core';

export const CONTENT_CALLED = '[Background] Content Called';

export const contentCalled = createAction(CONTENT_CALLED, props<{ message: string; timestamp: number, tabId: number }>());
`;
