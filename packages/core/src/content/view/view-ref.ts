export class ViewRef<T> {
  private teardown: (() => void) | null = null;
  public readonly controller: T;
  private mountFn: () => (() => void);

  constructor(controller: T, mountFn: () => (() => void)) {
    this.controller = controller;
    this.mountFn = mountFn;
  }

  get isMounted(): boolean {
    return this.teardown !== null;
  }

  mount(): void {
    if (this.teardown) {
      throw new Error('[HexaJS] View is already mounted. Call unmount() before mounting again.');
    }
    this.teardown = this.mountFn();
  }

  unmount(): void {
    if (this.teardown) {
      this.teardown();
      this.teardown = null;
    }
  }
}
