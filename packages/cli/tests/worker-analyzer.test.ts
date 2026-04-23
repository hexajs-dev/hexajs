import { describe, expect, it } from 'vitest';
import { WorkerAnalyzer } from '../src/analyzer/background/worker/analyzer';
import { DIAnalyzer } from '../src/analyzer/di/analyzer';
import { HexaContext, ServiceMetadata } from '../src/compiler/di/types';
import { WorkerMetadata } from '../src/compiler/background/worker/types';

function makeService(className: string, context: HexaContext, dependencies: string[] = []): ServiceMetadata {
  return { className, context, dependencies, tokenDependencies: [], viewDependencies: [], viewPropertyDependencies: [], workerPropertyDependencies: [], importPath: `src/${className}.ts`, hasOnInit: false, hasOnDestroy: false };
}

function makeWorker(name: string, className: string, dependencies: string[] = [], publicMethods: string[] = ['run'], workerPropertyDependencies: WorkerMetadata['workerPropertyDependencies'] = []): WorkerMetadata {
  return { className, name, environment: 'compute', importPath: `src/${className}.ts`, dependencies, tokenDependencies: [], workerPropertyDependencies, publicMethods };
}

describe('WorkerAnalyzer', () => {
  it('passes when worker depends on background and general services', () => {
    const services = [
      makeService('CryptoService', HexaContext.Background),
      makeService('LoggingService', HexaContext.General),
    ];
    const workers = [makeWorker('crypto', 'CryptoWorker', ['CryptoService', 'LoggingService'])];

    const diAnalyzer = new DIAnalyzer(services, {});
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when worker depends on content service', () => {
    const services = [
      makeService('ContentService', HexaContext.Content),
    ];
    const workers = [makeWorker('parser', 'ParserWorker', ['ContentService'])];

    const diAnalyzer = new DIAnalyzer(services, {});
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('context-violation');
    expect(result.errors[0].dependency).toBe('ContentService');
  });

  it('fails when worker depends on UI service', () => {
    const services = [
      makeService('UiService', HexaContext.UI),
    ];
    const workers = [makeWorker('render', 'RenderWorker', ['UiService'])];

    const diAnalyzer = new DIAnalyzer(services, {});
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(false);
    expect(result.errors[0].type).toBe('context-violation');
  });

  it('fails when worker depends on unregistered service', () => {
    const workers = [makeWorker('compute', 'ComputeWorker', ['UnknownService'])];

    const diAnalyzer = new DIAnalyzer([], {});
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(false);
    expect(result.errors[0].type).toBe('missing-service');
  });

  it('warns when worker has no public methods', () => {
    const workers = [makeWorker('empty', 'EmptyWorker', [], [])];

    const diAnalyzer = new DIAnalyzer([], {});
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe('invalid-config');
  });

  it('passes with no workers', () => {
    const diAnalyzer = new DIAnalyzer([], {});
    const analyzer = new WorkerAnalyzer([], diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes when worker uses @InjectWorker() property for another worker', () => {
    const workers = [
      makeWorker('ocr', 'OcrWorker'),
      makeWorker('pipeline', 'PipelineWorker', [], ['run'], [{ propertyName: 'ocrWorker', workerClassName: 'OcrWorker' }]),
    ];

    const diAnalyzer = new DIAnalyzer([], {}, [], workers);
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(true);
  });

  it('fails when @InjectWorker() property references an unregistered worker', () => {
    const workers = [makeWorker('pipeline', 'PipelineWorker', [], ['run'], [{ propertyName: 'ocrWorker', workerClassName: 'OcrWorker' }])];

    const diAnalyzer = new DIAnalyzer([], {});
    const analyzer = new WorkerAnalyzer(workers, diAnalyzer);
    const result = analyzer.analyze();

    expect(result.isValid).toBe(false);
    expect(result.errors[0].type).toBe('missing-service');
    expect(result.errors[0].dependency).toBe('OcrWorker');
  });
});
