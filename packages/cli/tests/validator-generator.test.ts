import { describe, expect, it } from 'vitest';
import { MetadataRegistry } from '../src/compiler/registry';
import { ValidatorGenerator } from '../src/generators/validator/generator';

function createRegistry(): MetadataRegistry {
  const registry = new MetadataRegistry();

  registry.addController({
    className: 'BackgroundController',
    namespace: 'bg',
    methods: [
      {
        methodName: 'ping',
        actionName: 'ping',
        payloadDtoType: 'PingDto',
        responseDtoType: 'PongDto',
      },
      {
        methodName: 'missing',
        actionName: 'missing',
        payloadDtoType: 'MissingBackgroundDto',
      },
    ],
    dependencies: [],
    tokenDependencies: [],
    importPath: 'src/background/controller.ts',
    hasOnInit: false,
    hasOnDestroy: false,
  });

  registry.addHandler({
    className: 'ContentHandler',
    namespace: 'content',
    methods: [
      {
        methodName: 'message',
        handleName: 'message',
        payloadDtoType: 'MessageDto',
      },
      {
        methodName: 'missingResponse',
        handleName: 'missingResponse',
        responseDtoType: 'MissingContentDto',
      },
    ],
    dependencies: [],
    tokenDependencies: [],
    viewDependencies: [],
    viewPropertyDependencies: [],
    importPath: 'src/content/handler.ts',
    contents: [],
    hasOnInit: false,
    hasOnDestroy: false,
  });

  registry.addDtoValidation({
    className: 'PingDto',
    importPath: 'src/dto/ping.dto.ts',
    properties: [{ name: 'id', decorators: [{ name: 'IsString', args: [] }] }],
    hasIndexSignature: false,
  });

  registry.addDtoValidation({
    className: 'PongDto',
    importPath: 'src/dto/pong.dto.ts',
    properties: [{ name: 'ok', decorators: [{ name: 'IsBoolean', args: [] }] }],
    hasIndexSignature: false,
  });

  registry.addDtoValidation({
    className: 'MessageDto',
    importPath: 'src/dto/message.dto.ts',
    properties: [{ name: 'message', decorators: [{ name: 'IsString', args: [] }] }],
    hasIndexSignature: false,
  });

  return registry;
}

describe('ValidatorGenerator', () => {
  it('emits background and content route validators for DTOs with metadata', () => {
    const registry = createRegistry();
    const output = new ValidatorGenerator(registry).generate();

    expect(output.background).toContain("'ping': validatePingDto,");
    expect(output.background).toContain("'ping': validateResponsePongDto,");
    expect(output.background).toContain('function validatePingDto(data)');
    expect(output.background).toContain('function validateResponsePongDto(data)');

    expect(output.content).toContain("'message': validateMessageDto,");
    expect(output.content).toContain('function validateMessageDto(data)');
  });

  it('skips routes whose DTO validation metadata is missing', () => {
    const registry = createRegistry();
    const output = new ValidatorGenerator(registry).generate();

    expect(output.background).not.toContain("'missing': validateMissingBackgroundDto,");
    expect(output.content).not.toContain("'missingResponse': validateResponseMissingContentDto,");
  });

  it('keeps validation opt-in for routed DTOs without decorator metadata', () => {
    const registry = new MetadataRegistry();

    registry.addController({
      className: 'PlainController',
      namespace: 'plain',
      methods: [
        {
          methodName: 'get',
          actionName: 'plain:get',
          payloadDtoType: 'PlainDto',
        },
      ],
      dependencies: [],
      tokenDependencies: [],
      importPath: 'src/plain/controller.ts',
      hasOnInit: false,
      hasOnDestroy: false,
    });

    const output = new ValidatorGenerator(registry).generate();

    expect(output.background).not.toContain("'plain:get': validatePlainDto,");
    expect(output.background).not.toContain('function validatePlainDto(data)');
  });
});
