declare global {
    namespace webExt {
        namespace action {
            function setTitle(details: { title: string; tabId?: number }): Promise<void>;
            function setBadgeText(details: { text: string; tabId?: number }): Promise<void>;
            function setBadgeBackgroundColor(details: { color: string; tabId?: number }): Promise<void>;
            function setIcon(details: { path?: string | { [size: number]: string }; tabId?: number; imageData?: any }): Promise<void>;
            function setPopup(details: { popup: string; tabId?: number }): Promise<void>;
            function enable(tabId?: number): Promise<void>;
            function disable(tabId?: number): Promise<void>;
            const onClicked: { addListener(callback: (tab: HexaWebTab) => void): void; removeListener(callback: (tab: HexaWebTab) => void): void };
        }
    }
}

export {};
