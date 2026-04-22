import { TokenDependency } from '../../di/types';

export interface ViewDependency {
  paramIndex: number;
  viewClassName: string;
}

export interface ViewPropertyDependency {
  propertyName: string;
  viewClassName: string;
}

export interface ViewMetadata {
  className: string;
  importPath: string;
  id: string;
  componentImportPath: string;
  componentExportName: string;
  stylesImportPath?: string;
  stylesExportName?: string;
  anchorSelector?: string;
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  viewDependencies: ViewDependency[];
  viewPropertyDependencies: ViewPropertyDependency[];
  extendsHexaView: boolean;
  hasOnInit: boolean;
  hasOnDestroy: boolean;
}
