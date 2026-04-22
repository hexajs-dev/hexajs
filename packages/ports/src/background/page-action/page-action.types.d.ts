declare global {
    namespace webExt {
        namespace pageAction {
            function show(tabId: number): Promise<void>;
            function hide(tabId: number): Promise<void>;
            function setTitle(details: { tabId: number; title?: string }): Promise<void>;
            function setIcon(details: { tabId: number; path?: string | { [size: number]: string }; imageData?: any }): Promise<void>;
            function setPopup(details: { tabId: number; popup: string }): Promise<void>;
            const onClicked: { addListener(callback: (tab: HexaWebTab) => void): void; removeListener(callback: (tab: HexaWebTab) => void): void };
        }
    }
}

export {};
