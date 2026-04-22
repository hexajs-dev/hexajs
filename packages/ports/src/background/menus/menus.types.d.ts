declare global {
    interface HexaWebMenusCreateProperties {
        id?: string;
        title?: string;
        type?: 'normal' | 'checkbox' | 'radio' | 'separator';
        contexts?: Array<'all' | 'page' | 'selection' | 'link' | 'editable' | 'image' | 'video' | 'audio' | 'launcher' | 'browser_action' | 'page_action' | 'action'>;
        parentId?: string | number;
        documentUrlPatterns?: string[];
        targetUrlPatterns?: string[];
        enabled?: boolean;
        checked?: boolean;
    }

    namespace webExt {
        namespace menus {
            function create(createProperties: HexaWebMenusCreateProperties, callback?: () => void): string | number;
            function update(id: string | number, updateProperties: Partial<HexaWebMenusCreateProperties>): Promise<void>;
            function remove(id: string | number): Promise<void>;
            function removeAll(): Promise<void>;
            const onClicked: { addListener(callback: (info: any, tab?: HexaWebTab) => void): void; removeListener(callback: (info: any, tab?: HexaWebTab) => void): void };
        }
    }
}

export {};
