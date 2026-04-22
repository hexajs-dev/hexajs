import type { ScaffoldContext } from '../models/scaffold.types';

export const contentStateTemplate = (_ctx: ScaffoldContext): string => `\
import { State } from '@hexajs/core';
import { InjectableContext } from '@hexajs/common';
import { ContentState, LastBackgroundCallReducer } from './content.reducer';

@State<ContentState>({
  context: InjectableContext.Content,
  state: {
    lastBackgroundCall: LastBackgroundCallReducer,
  },
})
export class ContentStateConfig {}
`;
