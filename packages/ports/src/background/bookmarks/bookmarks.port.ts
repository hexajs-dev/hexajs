import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';
import { rejectUnsupportedApi, throwUnsupportedApi } from '../../shared/methods/port-errors.methods';

@Injectable({ context: InjectableContext.Background })
export class BookmarksPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    create(bookmark: HexaWebBookmarkCreateArg): Promise<HexaWebBookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.create) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.create', this.platform, 'bookmarks.create');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.create(bookmark)).then((node: HexaWebBookmarkTreeNode) => resolve(node)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.create) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.create', this.platform, 'bookmarks.create');
                        return;
                    }
                    chromeApi.bookmarks.create(bookmark, (node: HexaWebBookmarkTreeNode) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(node);
                        }
                    });
                    return;
                }
            }
        });
    }

    get(idOrIdList: string | string[]): Promise<HexaWebBookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.get) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.get', this.platform, 'bookmarks.get');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.get(idOrIdList)).then((nodes: HexaWebBookmarkTreeNode[]) => resolve(nodes || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.get) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.get', this.platform, 'bookmarks.get');
                        return;
                    }
                    chromeApi.bookmarks.get(idOrIdList, (nodes: HexaWebBookmarkTreeNode[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(nodes || []);
                        }
                    });
                    return;
                }
            }
        });
    }

    getTree(): Promise<HexaWebBookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.getTree) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.getTree', this.platform, 'bookmarks.getTree');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.getTree()).then((nodes: HexaWebBookmarkTreeNode[]) => resolve(nodes || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.getTree) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.getTree', this.platform, 'bookmarks.getTree');
                        return;
                    }
                    chromeApi.bookmarks.getTree((nodes: HexaWebBookmarkTreeNode[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(nodes || []);
                        }
                    });
                    return;
                }
            }
        });
    }

    search(query: string | { query?: string; title?: string; url?: string }): Promise<HexaWebBookmarkTreeNode[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.search) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.search', this.platform, 'bookmarks.search');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.search(query)).then((nodes: HexaWebBookmarkTreeNode[]) => resolve(nodes || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.search) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.search', this.platform, 'bookmarks.search');
                        return;
                    }
                    chromeApi.bookmarks.search(query as any, (nodes: HexaWebBookmarkTreeNode[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(nodes || []);
                        }
                    });
                    return;
                }
            }
        });
    }

    update(id: string, changes: HexaWebBookmarkChanges): Promise<HexaWebBookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.update) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.update', this.platform, 'bookmarks.update');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.update(id, changes)).then((node: HexaWebBookmarkTreeNode) => resolve(node)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.update) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.update', this.platform, 'bookmarks.update');
                        return;
                    }
                    chromeApi.bookmarks.update(id, changes, (node: HexaWebBookmarkTreeNode) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(node);
                        }
                    });
                    return;
                }
            }
        });
    }

    move(id: string, destination: HexaWebBookmarkMoveDestination): Promise<HexaWebBookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.move) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.move', this.platform, 'bookmarks.move');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.move(id, destination)).then((node: HexaWebBookmarkTreeNode) => resolve(node)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.move) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.move', this.platform, 'bookmarks.move');
                        return;
                    }
                    chromeApi.bookmarks.move(id, destination, (node: HexaWebBookmarkTreeNode) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(node);
                        }
                    });
                    return;
                }
            }
        });
    }

    remove(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.remove) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.remove', this.platform, 'bookmarks.remove');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.remove(id)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.remove) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.remove', this.platform, 'bookmarks.remove');
                        return;
                    }
                    chromeApi.bookmarks.remove(id, () => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve();
                        }
                    });
                    return;
                }
            }
        });
    }

    removeTree(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.bookmarks?.removeTree) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.removeTree', this.platform, 'bookmarks.removeTree');
                        return;
                    }
                    Promise.resolve(browserApi.bookmarks.removeTree(id)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.bookmarks?.removeTree) {
                        rejectUnsupportedApi(reject, 'BookmarksPort.removeTree', this.platform, 'bookmarks.removeTree');
                        return;
                    }
                    chromeApi.bookmarks.removeTree(id, () => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve();
                        }
                    });
                    return;
                }
            }
        });
    }

    onCreatedAddListener(listener: (id: string, bookmark: HexaWebBookmarkTreeNode) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onCreated?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onCreatedAddListener', this.platform, 'bookmarks.onCreated.addListener');
                }
                browserApi.bookmarks.onCreated.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onCreated?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onCreatedAddListener', this.platform, 'bookmarks.onCreated.addListener');
                }
                chromeApi.bookmarks.onCreated.addListener(listener);
                return;
            }
        }
    }

    onCreatedRemoveListener(listener: (id: string, bookmark: HexaWebBookmarkTreeNode) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onCreated?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onCreatedRemoveListener', this.platform, 'bookmarks.onCreated.removeListener');
                }
                browserApi.bookmarks.onCreated.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onCreated?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onCreatedRemoveListener', this.platform, 'bookmarks.onCreated.removeListener');
                }
                chromeApi.bookmarks.onCreated.removeListener(listener);
                return;
            }
        }
    }

    onRemovedAddListener(listener: (id: string, removeInfo: HexaWebBookmarkRemoveInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onRemoved?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onRemovedAddListener', this.platform, 'bookmarks.onRemoved.addListener');
                }
                browserApi.bookmarks.onRemoved.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onRemoved?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onRemovedAddListener', this.platform, 'bookmarks.onRemoved.addListener');
                }
                chromeApi.bookmarks.onRemoved.addListener(listener);
                return;
            }
        }
    }

    onRemovedRemoveListener(listener: (id: string, removeInfo: HexaWebBookmarkRemoveInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onRemoved?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onRemovedRemoveListener', this.platform, 'bookmarks.onRemoved.removeListener');
                }
                browserApi.bookmarks.onRemoved.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onRemoved?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onRemovedRemoveListener', this.platform, 'bookmarks.onRemoved.removeListener');
                }
                chromeApi.bookmarks.onRemoved.removeListener(listener);
                return;
            }
        }
    }

    onChangedAddListener(listener: (id: string, changeInfo: HexaWebBookmarkChanges) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onChanged?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onChangedAddListener', this.platform, 'bookmarks.onChanged.addListener');
                }
                browserApi.bookmarks.onChanged.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onChanged?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onChangedAddListener', this.platform, 'bookmarks.onChanged.addListener');
                }
                chromeApi.bookmarks.onChanged.addListener(listener);
                return;
            }
        }
    }

    onChangedRemoveListener(listener: (id: string, changeInfo: HexaWebBookmarkChanges) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onChanged?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onChangedRemoveListener', this.platform, 'bookmarks.onChanged.removeListener');
                }
                browserApi.bookmarks.onChanged.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onChanged?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onChangedRemoveListener', this.platform, 'bookmarks.onChanged.removeListener');
                }
                chromeApi.bookmarks.onChanged.removeListener(listener);
                return;
            }
        }
    }

    onMovedAddListener(listener: (id: string, moveInfo: { parentId: string; index: number; oldParentId: string; oldIndex: number }) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onMoved?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onMovedAddListener', this.platform, 'bookmarks.onMoved.addListener');
                }
                browserApi.bookmarks.onMoved.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onMoved?.addListener) {
                    throwUnsupportedApi('BookmarksPort.onMovedAddListener', this.platform, 'bookmarks.onMoved.addListener');
                }
                chromeApi.bookmarks.onMoved.addListener(listener);
                return;
            }
        }
    }

    onMovedRemoveListener(listener: (id: string, moveInfo: { parentId: string; index: number; oldParentId: string; oldIndex: number }) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.bookmarks?.onMoved?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onMovedRemoveListener', this.platform, 'bookmarks.onMoved.removeListener');
                }
                browserApi.bookmarks.onMoved.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.bookmarks?.onMoved?.removeListener) {
                    throwUnsupportedApi('BookmarksPort.onMovedRemoveListener', this.platform, 'bookmarks.onMoved.removeListener');
                }
                chromeApi.bookmarks.onMoved.removeListener(listener);
                return;
            }
        }
    }
}
