import { State } from '@hexajs/core';
import { InjectableContext } from '@hexajs/common';
import { BackgroundState, ConfigReducer, ClipsReducer } from './background.reducer';

@State<BackgroundState>({
  context: InjectableContext.Background,
  state: {
    config: ConfigReducer,
    clips: ClipsReducer,
  },
})
export class BackgroundStateConfig {}
