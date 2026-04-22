
/** 
 * * Logic/Service: Only DI 
 */


export enum HexaContext {
  Content = 'content',
  Background = 'background',
  UI = 'ui',
  General = 'general'
} 

export interface TokenDependency {
  paramIndex: number;
  tokenKey: string;
}

export interface TokenMetadata {
  key: string;
  defaultValue: string | number | boolean | null;
  context: HexaContext;
  importPath: string;
}

export interface ViewPropertyDependency {
  propertyName: string;
  viewClassName: string;
}

export interface ServiceMetadata {
  className: string;
  importPath: string;
  context: HexaContext;
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  viewDependencies: { paramIndex: number; viewClassName: string }[];
  viewPropertyDependencies: ViewPropertyDependency[];
  hasOnInit: boolean;
  hasOnDestroy: boolean;
}



