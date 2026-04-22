declare global {
    interface HexaWebHistorySearchQuery {
        text: string;
        startTime?: number;
        endTime?: number;
        maxResults?: number;
    }

    interface HexaWebHistoryItem {
        id?: string;
        url?: string;
        title?: string;
        lastVisitTime?: number;
        visitCount?: number;
        typedCount?: number;
    }

    namespace webExt {
        namespace history {
            function search(query: HexaWebHistorySearchQuery, callback?: (results: HexaWebHistoryItem[]) => void): void;
            function search(query: HexaWebHistorySearchQuery): Promise<HexaWebHistoryItem[]>;
            function addUrl(details: { url: string; title?: string; transition?: string; visitTime?: number }): Promise<void>;
            function deleteUrl(details: { url: string }): Promise<void>;
            function deleteRange(range: { startTime: number; endTime: number }): Promise<void>;
        }
    }
}

export {};
