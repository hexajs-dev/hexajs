declare global {
    interface HexaWebTabGroup {
        id: number;
        collapsed: boolean;
        color: string;
        title?: string;
        windowId: number;
    }

    interface HexaWebTabGroupQueryInfo {
        windowId?: number;
        title?: string;
        color?: string;
        collapsed?: boolean;
    }

    namespace webExt {
        namespace tabGroups {
            function get(groupId: number): Promise<HexaWebTabGroup>;
            function query(queryInfo: HexaWebTabGroupQueryInfo): Promise<HexaWebTabGroup[]>;
            function update(groupId: number, updateProperties: Partial<HexaWebTabGroup>): Promise<HexaWebTabGroup>;
        }
    }
}

export {};
