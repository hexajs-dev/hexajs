export interface AnalysisError {
  type: 'circular-dependency' | 'missing-service' | 'context-violation' | 'invalid-context' | 'missing-token' | 'duplicate-token' | 'missing-package' | 'invalid-config' | 'effect-validation';
  message: string;
  className: string;
  dependency?: string;
  context?: string;
  tokenKey?: string;
}

export interface AnalysisResult {
  errors: AnalysisError[];
  warnings: AnalysisError[];
  isValid: boolean;
}


export interface BaseAnalyzer {
  analyze(): AnalysisResult;
}