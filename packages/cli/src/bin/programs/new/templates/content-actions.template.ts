import type { ScaffoldContext } from '../models/scaffold.types';

export const contentActionsTemplate = (_ctx: ScaffoldContext): string => `\
import { createAction, props } from '@hexajs-dev/core';

export const BACKGROUND_CALLED = '[Content] Background Called';

export const backgroundCalled = createAction(BACKGROUND_CALLED, props<{ message: string; timestamp: number }>());
`;
