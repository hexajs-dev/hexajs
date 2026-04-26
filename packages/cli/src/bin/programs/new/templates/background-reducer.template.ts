import type { ScaffoldContext } from '../models/scaffold.types';

export const backgroundReducerTemplate = (_ctx: ScaffoldContext): string => `\
import { HexaReducer, Reduce, Reducer } from '@hexajs-dev/core';
import * as BackgroundActions from './background.actions';

export interface LastContentCallState {
  message: string;
  timestamp: number;
  tabId?: number;
}

export interface BackgroundState {
  lastContentCall: LastContentCallState;
}

@Reducer()
export class LastContentCallReducer extends HexaReducer<LastContentCallState> {
  initialState: LastContentCallState = {
    message: '',
    timestamp: 0,
  };

  @Reduce(BackgroundActions.CONTENT_CALLED)
  onContentCalled(state: LastContentCallState, action: ReturnType<typeof BackgroundActions.contentCalled>): LastContentCallState {
    if(!action.payload || !action.payload.message || !action.payload.timestamp) {
      console.warn('Invalid payload for CONTENT_CALLED action:', action.payload);
      return state; // Return current state if payload is invalid
    }
    return { ...action.payload };
  }
}
`;
