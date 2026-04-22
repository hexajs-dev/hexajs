export enum WorkerEnvironment {
  Compute = 'compute',
  DOM = 'dom',
}

export interface WorkerOptions {
  name: string;
  environment?: WorkerEnvironment;
}

export function Worker(options: WorkerOptions): ClassDecorator {
  return (target: any) => {
    target.__hexa_worker__ = {
      type: 'worker',
      options: {
        name: options.name,
        environment: options.environment ?? WorkerEnvironment.Compute,
      },
    };
    return target;
  };
}
