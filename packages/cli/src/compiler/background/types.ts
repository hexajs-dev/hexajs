import { TokenDependency } from "../di/types";

/** 
 * * Background Entry: Specific to Service Workers/Background Scripts V3 only
 */
export interface BackgroundEntryMetadata {
  className: string;
  importPath: string;
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  hasOnInit: boolean;
  hasOnDestroy: boolean;
}

