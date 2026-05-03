import type { ScaffoldContext } from '../models/scaffold.types';

export const backgroundStateTemplate = (_ctx: ScaffoldContext): string => `\
import { State } from '@hexajs-dev/core';
import { HexaContext } from '@hexajs-dev/common';
import { BackgroundState, LastContentCallReducer } from './background.reducer';

@State<BackgroundState>({
  context: HexaContext.Background,
  state: {
    lastContentCall: LastContentCallReducer,
  },
})
export class BackgroundStateConfig {}
`;
