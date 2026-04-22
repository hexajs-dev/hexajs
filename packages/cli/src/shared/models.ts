export interface PackageMetadata {
  [className: string]: {
    injectable: true;
    context: string;
  };
}