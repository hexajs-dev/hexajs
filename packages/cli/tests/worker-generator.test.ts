import { describe, expect, it } from 'vitest';
import { WorkerGenerator } from '../src/generators/background/worker/generator';
import { MetadataRegistry } from '../src/compiler/registry';
import { HexaContext } from '../src/compiler/di/types';

function createRegistryWithWorkers(
  workers: Array<{ name: string; className: string; environment?: string; dependencies?: string[]; publicMethods?: string[]; workerPropertyDependencies?: { propertyName: string; workerClassName: string }[] }>,
  services: Array<{ className: string; context: HexaContext; dependencies?: string[]; workerPropertyDependencies?: { propertyName: string; workerClassName: string }[] }> = []
) {
  const registry = new MetadataRegistry();

  for (const s of services) {
    registry.addService({
      className: s.className,
      context: s.context,
      dependencies: s.dependencies ?? [],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [],
      workerPropertyDependencies: s.workerPropertyDependencies ?? [],
      importPath: `src/${s.className}.ts`,
      hasOnInit: false,
      hasOnDestroy: false,
    });
  }

  for (const w of workers) {
    registry.addWorker({
      className: w.className,
      name: w.name,
      environment: w.environment ?? 'compute',
      importPath: `src/${w.className}.ts`,
      dependencies: w.dependencies ?? [],
      tokenDependencies: [],
      workerPropertyDependencies: w.workerPropertyDependencies ?? [],
      publicMethods: w.publicMethods ?? ['run'],
    });
  }

  return registry;
}

describe('WorkerGenerator', () => {
  describe('generate()', () => {
    it('returns empty output when no workers exist', () => {
      const registry = new MetadataRegistry();
      const generator = new WorkerGenerator(registry);
      const result = generator.generate();

      expect(result.hostRouterContent).toBe('');
      expect(result.workerScripts).toHaveLength(0);
      expect(result.offscreenHtml).toBeNull();
    });

    it('generates host router with correct worker mapping', () => {
      const registry = createRegistryWithWorkers([
        { name: 'crypto-task', className: 'CryptoWorker', publicMethods: ['hash', 'encrypt'] },
        { name: 'image-proc', className: 'ImageWorker', publicMethods: ['resize'] },
      ]);

      const generator = new WorkerGenerator(registry);
      const result = generator.generate();

      expect(result.hostRouterContent).toContain("'crypto-task': './worker-crypto-task.js'");
      expect(result.hostRouterContent).toContain("'image-proc': './worker-image-proc.js'");
      expect(result.hostRouterContent).toContain('HEXA_WORKER_CALL');
      expect(result.hostRouterContent).toContain('__HEXA_ACTIVE_WORKER_CALL__');
    });

    it('generates individual worker scripts with methods map', () => {
      const registry = createRegistryWithWorkers([
        { name: 'crypto-task', className: 'CryptoWorker', publicMethods: ['hash', 'encrypt'] },
      ]);

      const generator = new WorkerGenerator(registry);
      const result = generator.generate();

      expect(result.workerScripts).toHaveLength(1);
      expect(result.workerScripts[0].name).toBe('worker-crypto-task');
      expect(result.workerScripts[0].content).toContain('export const methods');
      expect(result.workerScripts[0].content).toContain('hash:');
      expect(result.workerScripts[0].content).toContain('encrypt:');
    });

    it('generates offscreen HTML for chromium with DOM workers', () => {
      const registry = createRegistryWithWorkers([
        { name: 'renderer', className: 'RendererWorker', environment: 'dom', publicMethods: ['render'] },
      ]);

      const generator = new WorkerGenerator(registry, [], [], '', 'chrome');
      const result = generator.generate();

      expect(result.offscreenHtml).not.toBeNull();
      expect(result.offscreenHtml).toContain('hexa.worker.js');
      expect(result.offscreenHtml).toContain('<!DOCTYPE html>');
    });

    it('does not generate offscreen HTML for firefox', () => {
      const registry = createRegistryWithWorkers([
        { name: 'renderer', className: 'RendererWorker', environment: 'dom', publicMethods: ['render'] },
      ]);

      const generator = new WorkerGenerator(registry, [], [], '', 'firefox');
      const result = generator.generate();

      expect(result.offscreenHtml).toBeNull();
    });

    it('does not generate offscreen HTML for compute-only workers', () => {
      const registry = createRegistryWithWorkers([
        { name: 'crypto-task', className: 'CryptoWorker', environment: 'compute', publicMethods: ['hash'] },
      ]);

      const generator = new WorkerGenerator(registry, [], [], '', 'chrome');
      const result = generator.generate();

      expect(result.offscreenHtml).toBeNull();
    });

    it('includes DI container setup in worker scripts', () => {
      const registry = createRegistryWithWorkers(
        [{ name: 'compute', className: 'ComputeWorker', dependencies: ['CryptoService'], publicMethods: ['run'] }],
        [{ className: 'CryptoService', context: HexaContext.Background }],
      );

      const generator = new WorkerGenerator(registry);
      const result = generator.generate();

      expect(result.workerScripts[0].content).toContain('Container');
      expect(result.workerScripts[0].content).toContain('CryptoService');
      expect(result.workerScripts[0].content).toContain('setupDependencies');
    });

    it('assigns worker properties on background services used inside worker scripts', () => {
      const registry = createRegistryWithWorkers(
        [
          { name: 'ocr-worker', className: 'OcrWorker', publicMethods: ['recognize'] },
          { name: 'pipeline-worker', className: 'PipelineWorker', dependencies: ['ClipperOcrService'], publicMethods: ['run'] },
        ],
        [{ className: 'ClipperOcrService', context: HexaContext.Background, workerPropertyDependencies: [{ propertyName: 'ocrWorker', workerClassName: 'OcrWorker' }] }],
      );

      const generator = new WorkerGenerator(registry);
      const result = generator.generate();

      expect(result.workerScripts[1].content).toContain("instance.ocrWorker = c.resolve(OcrWorker);");
    });

    it('registers and assigns worker proxies for worker @InjectWorker() properties', () => {
      const registry = createRegistryWithWorkers([
        { name: 'ocr-worker', className: 'OcrWorker', publicMethods: ['recognize'] },
        { name: 'pipeline-worker', className: 'PipelineWorker', publicMethods: ['run'], workerPropertyDependencies: [{ propertyName: 'ocrWorker', workerClassName: 'OcrWorker' }] },
      ]);

      const generator = new WorkerGenerator(registry);
      const result = generator.generate();
      const pipelineScript = result.workerScripts.find(script => script.name === 'worker-pipeline-worker')?.content ?? '';

      expect(pipelineScript).toContain("container.register(OcrWorker, () => createWorkerProxy('ocr-worker', WorkerEnvironment.Compute));");
      expect(pipelineScript).toContain('instance.ocrWorker = container.resolve(OcrWorker);');
    });
  });
});
