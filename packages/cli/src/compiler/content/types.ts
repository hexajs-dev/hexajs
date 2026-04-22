import { TokenDependency, ViewPropertyDependency } from "../di/types";
import { ViewDependency } from "./view/types";

/** 
 * * Content Entry: Specific to UI/DOM injection 
 */

export enum ContentRunAt {
  DocumentStart = 'document_start',
  DocumentEnd = 'document_end',
  DocumentIdle = 'document_idle'
}

export interface ContentOptions {
  matches: string[]; 
  runAt: ContentRunAt;
  allFrames?: boolean;
}
export interface ContentEntryMetadata {
  className: string;
  importPath: string;
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  viewDependencies: ViewDependency[];
  viewPropertyDependencies: ViewPropertyDependency[];
  options: ContentOptions;
  hasOnInit: boolean;
  hasOnDestroy: boolean;
}
