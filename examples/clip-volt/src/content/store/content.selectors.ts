import { ContentState } from "./content.reducer";

export const selectClips = (state: ContentState) => state.clips || [];
export const selectFilteredClips = (state: ContentState) => state.clips?.filtered || [];

export const selectConfig = (state: ContentState) => state.config;
export const selectTheme = (state: ContentState) => state.config.theme;
export const selectExcludedDomains = (state: ContentState) => state.config.urlRules.exclude;