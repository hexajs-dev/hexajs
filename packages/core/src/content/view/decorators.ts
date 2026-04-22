export interface ViewOptions {
  id: string;
  component: any;
  styles?: string;
  anchorSelector?: string;
}

export function View(options: ViewOptions): ClassDecorator {
  return (target: any) => {
    target.__hexa_view__ = { type: 'view', options };
    return target;
  };
}

export function InjectView(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const ctor = target.constructor;
    const existing: string[] = ctor.__hexa_view_property_injects__ || [];
    existing.push(String(propertyKey));
    ctor.__hexa_view_property_injects__ = existing;
  };
}
