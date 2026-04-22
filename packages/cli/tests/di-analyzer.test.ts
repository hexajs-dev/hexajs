import { describe, expect, it } from 'vitest';
import { DIAnalyzer } from '../src/analyzer/di/analyzer';
import { WorkerMetadata } from '../src/compiler/background/worker/types';
import { HexaContext, ServiceMetadata, TokenMetadata } from '../src/compiler/di/types';
import { PackageMetadata } from '../src/shared/models';

function makeService(className: string, context: HexaContext, dependencies: string[] = []): ServiceMetadata {
	return { className, context, dependencies, tokenDependencies: [], viewDependencies: [], importPath: `src/${className}.ts`, hasOnInit: false, hasOnDestroy: false };
}

function makeWorker(className: string): WorkerMetadata {
	return { className, name: className.toLowerCase(), environment: 'dom', importPath: `src/${className}.ts`, dependencies: [], tokenDependencies: [], publicMethods: ['run'] };
}

describe('DIAnalyzer', () => {
	describe('detectMissingDependencies', () => {
		it('does not report an error when a service depends on a framework package port', () => {
			const packageMetadata: PackageMetadata = {
				TabsPort: { injectable: true, context: 'background' }
			};
			const services = [
				makeService('ClipperCaptureService', HexaContext.Background, ['ClipperImageCropService', 'TabsPort']),
				makeService('ClipperImageCropService', HexaContext.Background)
			];

			const analyzer = new DIAnalyzer(services, packageMetadata);
			const result = analyzer.analyze();

			const missingErrors = result.errors.filter(e => e.type === 'missing-service');
			expect(missingErrors).toHaveLength(0);
		});

		it('reports an error when a service depends on a genuinely unregistered class', () => {
			const services = [
				makeService('MyService', HexaContext.Background, ['UnknownService'])
			];

			const analyzer = new DIAnalyzer(services, {});
			const result = analyzer.analyze();

			const missingErrors = result.errors.filter(e => e.type === 'missing-service');
			expect(missingErrors).toHaveLength(1);
			expect(missingErrors[0].dependency).toBe('UnknownService');
			expect(missingErrors[0].className).toBe('MyService');
		});

		it('does not report an error when a service depends on a scanned worker', () => {
			const services = [
				makeService('ClipperOcrService', HexaContext.Background, ['OcrWorker'])
			];
			const analyzer = new DIAnalyzer(services, {}, [], [makeWorker('OcrWorker')]);
			const result = analyzer.analyze();

			const missingErrors = result.errors.filter(e => e.type === 'missing-service');
			expect(missingErrors).toHaveLength(0);
		});

		it('still enforces context boundary even when dependency is from package metadata', () => {
			const packageMetadata: PackageMetadata = {
				SomeContentPort: { injectable: true, context: 'content' }
			};
			const services = [
				makeService('BackgroundService', HexaContext.Background, ['SomeContentPort'])
			];

			const analyzer = new DIAnalyzer(services, packageMetadata);
			const result = analyzer.analyze();

			const contextErrors = result.errors.filter(e => e.type === 'context-violation');
			expect(contextErrors).toHaveLength(1);
			expect(contextErrors[0].dependency).toBe('SomeContentPort');
		});
	});

	describe('detectInvalidContextUsage', () => {
		it('allows general services to inject any context', () => {
			const services = [
				makeService('GeneralUtil', HexaContext.General, ['BackgroundHelper']),
				makeService('BackgroundHelper', HexaContext.Background)
			];

			const analyzer = new DIAnalyzer(services, {});
			const result = analyzer.analyze();

			const contextErrors = result.errors.filter(e => e.type === 'context-violation');
			expect(contextErrors).toHaveLength(0);
		});
	});

	describe('detectCircularDependencies', () => {
		it('detects a direct circular dependency between two services', () => {
			const services = [
				makeService('A', HexaContext.Background, ['B']),
				makeService('B', HexaContext.Background, ['A'])
			];

			const analyzer = new DIAnalyzer(services, {});
			const result = analyzer.analyze();

			const circularErrors = result.errors.filter(e => e.type === 'circular-dependency');
			expect(circularErrors.length).toBeGreaterThan(0);
		});
	});

	describe('isServiceRegistered', () => {
		it('returns true for a locally scanned service', () => {
			const services = [makeService('LocalService', HexaContext.Background)];
			const analyzer = new DIAnalyzer(services, {});
			expect(analyzer.isServiceRegistered('LocalService')).toBe(true);
		});

		it('returns true for a service present only in package metadata', () => {
			const packageMetadata: PackageMetadata = {
				TabsPort: { injectable: true, context: 'background' }
			};
			const analyzer = new DIAnalyzer([], packageMetadata);
			expect(analyzer.isServiceRegistered('TabsPort')).toBe(true);
		});

		it('returns false for an unknown class', () => {
			const analyzer = new DIAnalyzer([], {});
			expect(analyzer.isServiceRegistered('GhostService')).toBe(false);
		});
	});

	describe('worker and service separation', () => {
		it('reports an error when the same class is registered as both service and worker', () => {
			const services = [makeService('OcrWorker', HexaContext.Background)];
			const workers = [makeWorker('OcrWorker')];

			const analyzer = new DIAnalyzer(services, {}, [], workers);
			const result = analyzer.analyze();

			const invalidConfigErrors = result.errors.filter(e => e.type === 'invalid-config');
			expect(invalidConfigErrors).toHaveLength(1);
			expect(invalidConfigErrors[0].className).toBe('OcrWorker');
		});
	});
});
