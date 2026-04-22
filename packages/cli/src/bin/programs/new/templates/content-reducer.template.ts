import type { ScaffoldContext } from '../models/scaffold.types';

export const contentReducerTemplate = (_ctx: ScaffoldContext): string => `\
import { HexaReducer, Reduce, Reducer } from '@hexajs/core';
import * as ContentActions from './content.actions';

export interface LastBackgroundCallState {
  message: string;
  timestamp: number;
}

export interface ContentState {
  lastBackgroundCall: LastBackgroundCallState;
}

@Reducer()
export class LastBackgroundCallReducer extends HexaReducer<LastBackgroundCallState> {
  initialState: LastBackgroundCallState = {
    message: '',
    timestamp: 0,
  };

  @Reduce(ContentActions.BACKGROUND_CALLED)
  onBackgroundCalled(state: LastBackgroundCallState, action: ReturnType<typeof ContentActions.backgroundCalled>): LastBackgroundCallState {
    return { message: action.payload.message, timestamp: action.payload.timestamp };
  }
}
`;
