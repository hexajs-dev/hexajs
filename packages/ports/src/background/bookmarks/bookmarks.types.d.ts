declare global {
    interface HexaWebBookmarkTreeNode {
        id: string;
        parentId?: string;
        index?: number;
        url?: string;
        title: string;
        dateAdded?: number;
        dateGroupModified?: number;
        children?: HexaWebBookmarkTreeNode[];
        unmodifiable?: 'managed';
    }

    interface HexaWebBookmarkCreateArg {
        parentId?: string;
        index?: number;
        title?: string;
        url?: string;
    }

    interface HexaWebBookmarkChanges {
        title?: string;
        url?: string;
    }

    interface HexaWebBookmarkMoveDestination {
        parentId?: string;
        index?: number;
    }

    interface HexaWebBookmarkRemoveInfo {
        parentId: string;
        index: number;
        node: HexaWebBookmarkTreeNode;
    }

    namespace webExt {
        namespace bookmarks {
            function create(bookmark: HexaWebBookmarkCreateArg): Promise<HexaWebBookmarkTreeNode>;
            function get(idOrIdList: string | string[]): Promise<HexaWebBookmarkTreeNode[]>;
            function getTree(): Promise<HexaWebBookmarkTreeNode[]>;
            function search(query: string | { query?: string; title?: string; url?: string }): Promise<HexaWebBookmarkTreeNode[]>;
            function update(id: string, changes: HexaWebBookmarkChanges): Promise<HexaWebBookmarkTreeNode>;
            function move(id: string, destination: HexaWebBookmarkMoveDestination): Promise<HexaWebBookmarkTreeNode>;
            function remove(id: string): Promise<void>;
            function removeTree(id: string): Promise<void>;
            const onCreated: { addListener(callback: (id: string, bookmark: HexaWebBookmarkTreeNode) => void): void; removeListener(callback: (id: string, bookmark: HexaWebBookmarkTreeNode) => void): void };
            const onRemoved: { addListener(callback: (id: string, removeInfo: HexaWebBookmarkRemoveInfo) => void): void; removeListener(callback: (id: string, removeInfo: HexaWebBookmarkRemoveInfo) => void): void };
            const onChanged: { addListener(callback: (id: string, changeInfo: HexaWebBookmarkChanges) => void): void; removeListener(callback: (id: string, changeInfo: HexaWebBookmarkChanges) => void): void };
            const onMoved: { addListener(callback: (id: string, moveInfo: { parentId: string; index: number; oldParentId: string; oldIndex: number }) => void): void; removeListener(callback: (id: string, moveInfo: { parentId: string; index: number; oldParentId: string; oldIndex: number }) => void): void };
        }
    }
}

export {};
