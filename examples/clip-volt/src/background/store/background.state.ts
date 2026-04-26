import { State } from '@hexajs-dev/core';
import { InjectableContext } from '@hexajs-dev/common';
import { BackgroundState, ConfigReducer, ClipsReducer } from './background.reducer';

@State<BackgroundState>({
  context: InjectableContext.Background,
  state: {
    config: ConfigReducer,
    clips: ClipsReducer,
  },
})
export class BackgroundStateConfig {}
