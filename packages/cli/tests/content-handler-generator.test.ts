import { describe, expect, it } from 'vitest';
import { HandlerMetadata } from '../src/compiler/content/handler/types';
import { ContentHandlerGenerator } from '../src/generators/content/handler/generator';

describe('ContentHandlerGenerator', () => {
  it('assigns @InjectView properties before handler registration', () => {
    const handler: HandlerMetadata = {
      className: 'DemoHandler',
      namespace: 'demo',
      methods: [
        {
          methodName: 'onPing',
          handleName: 'demo:ping',
        },
      ],
      dependencies: [],
      tokenDependencies: [],
      viewDependencies: [],
      viewPropertyDependencies: [
        { propertyName: 'overlayView', viewClassName: 'OverlayView' },
        { propertyName: 'tooltipView', viewClassName: 'TooltipView' },
      ],
      importPath: 'src/content/demo.handler.ts',
      contents: [],
      hasOnInit: false,
      hasOnDestroy: false,
    };

    const output = new ContentHandlerGenerator().generateRegistrations([handler]);
    const firstAssignment = `  demoHandler.overlayView = container.resolve(OverlayView);`;
    const secondAssignment = `  demoHandler.tooltipView = container.resolve(TooltipView);`;
    const registration = `  handlerContainer.registerUnicast('demo:ping', demoHandler.onPing.bind(demoHandler), resolveRouteBoundaryPolicy(DemoHandler, 'onPing'));`;

    expect(output).toContain(`  const demoHandler = new DemoHandler();`);
    expect(output).toContain(firstAssignment);
    expect(output).toContain(secondAssignment);
    expect(output).toContain(registration);
    expect(output.indexOf(firstAssignment)).toBeLessThan(output.indexOf(registration));
    expect(output.indexOf(secondAssignment)).toBeLessThan(output.indexOf(registration));
  });
});