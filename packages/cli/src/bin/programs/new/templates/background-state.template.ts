import type { ScaffoldContext } from '../models/scaffold.types';

export const backgroundStateTemplate = (_ctx: ScaffoldContext): string => `\
import { State } from '@hexajs/core';
import { InjectableContext } from '@hexajs/common';
import { BackgroundState, LastContentCallReducer } from './background.reducer';

@State<BackgroundState>({
  context: InjectableContext.Background,
  state: {
    lastContentCall: LastContentCallReducer,
  },
})
export class BackgroundStateConfig {}
`;
