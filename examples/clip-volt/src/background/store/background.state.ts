import { State } from '@hexajs-dev/core';
import { HexaContext } from '@hexajs-dev/common';
import { BackgroundState, ConfigReducer, ClipsReducer } from './background.reducer';

@State<BackgroundState>({
  context: HexaContext.Background,
  state: {
    config: ConfigReducer,
    clips: ClipsReducer,
  },
})
export class BackgroundStateConfig {}
