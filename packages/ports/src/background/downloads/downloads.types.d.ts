declare global {
    interface HexaWebDownloadsDownloadOptions {
        url: string;
        filename?: string;
        conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
        saveAs?: boolean;
        method?: 'GET' | 'POST';
        headers?: Array<{ name: string; value: string }>;
        body?: string;
    }

    interface HexaWebDownloadsQuery {
        id?: number;
        url?: string;
        filename?: string;
        state?: 'in_progress' | 'interrupted' | 'complete';
        limit?: number;
        orderBy?: string[];
    }

    interface HexaWebDownloadItem {
        id: number;
        url: string;
        filename: string;
        startTime?: string;
        endTime?: string;
        state?: 'in_progress' | 'interrupted' | 'complete';
        error?: string;
        bytesReceived?: number;
        totalBytes?: number;
        fileSize?: number;
        exists?: boolean;
        byExtensionId?: string;
        byExtensionName?: string;
    }

    namespace webExt {
        namespace downloads {
            function download(options: HexaWebDownloadsDownloadOptions, callback?: (downloadId: number) => void): void;
            function download(options: HexaWebDownloadsDownloadOptions): Promise<number>;
            function search(query: HexaWebDownloadsQuery, callback?: (items: HexaWebDownloadItem[]) => void): void;
            function search(query: HexaWebDownloadsQuery): Promise<HexaWebDownloadItem[]>;
            function erase(query: HexaWebDownloadsQuery, callback?: (erasedIds: number[]) => void): void;
            function erase(query: HexaWebDownloadsQuery): Promise<number[]>;
            function pause(downloadId: number, callback?: () => void): void;
            function pause(downloadId: number): Promise<void>;
            function resume(downloadId: number, callback?: () => void): void;
            function resume(downloadId: number): Promise<void>;
            function cancel(downloadId: number, callback?: () => void): void;
            function cancel(downloadId: number): Promise<void>;
            function show(downloadId: number): Promise<void>;
            function open(downloadId: number): Promise<void>;
            const onChanged: { addListener(callback: (delta: any) => void): void; removeListener(callback: (delta: any) => void): void };
        }
    }
}

export {};
