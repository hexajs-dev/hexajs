import type { ScaffoldContext } from '../models/scaffold.types';

export const contentStateTemplate = (_ctx: ScaffoldContext): string => `\
import { State } from '@hexajs-dev/core';
import { HexaContext } from '@hexajs-dev/common';
import { ContentState, LastBackgroundCallReducer } from './content.reducer';

@State<ContentState>({
  context: HexaContext.Content,
  state: {
    lastBackgroundCall: LastBackgroundCallReducer,
  },
})
export class ContentStateConfig {}
`;
