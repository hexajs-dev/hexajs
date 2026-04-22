import { ViewRef } from './view-ref';

export abstract class HexaView {
  public viewRef!: ViewRef<this>;

  mount(): void {
    this.viewRef.mount();
  }

  unmount(): void {
    this.viewRef.unmount();
  }

  get isMounted(): boolean {
    return this.viewRef.isMounted;
  }
}
