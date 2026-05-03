import { State } from '@hexajs-dev/core';
import { HexaContext } from '@hexajs-dev/common';
import { ContentState, ContentClipsReducer, ContentConfigReducer } from './content.reducer';
import { ContentEffects } from './content.effects';

@State<ContentState>({
  context: HexaContext.Content,
  state: {
    clips: ContentClipsReducer,
    config: ContentConfigReducer,
  },
  effects: [ContentEffects],
})
export class ContentStateConfig {}
