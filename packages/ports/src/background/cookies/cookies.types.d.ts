declare global {
    type HexaWebSameSiteStatus = 'no_restriction' | 'lax' | 'strict' | 'unspecified';
    type HexaWebOnChangedCause = 'evicted' | 'expired' | 'explicit' | 'expired_overwrite' | 'overwrite';

    interface HexaWebCookiePartitionKey {
        topLevelSite?: string;
        hasCrossSiteAncestor?: boolean;
    }

    interface HexaWebCookie {
        name: string;
        value: string;
        domain: string;
        path: string;
        expirationDate?: number;
        hostOnly: boolean;
        httpOnly: boolean;
        secure: boolean;
        session: boolean;
        storeId: string;
        sameSite?: HexaWebSameSiteStatus;
        firstPartyDomain?: string;
        partitionKey?: HexaWebCookiePartitionKey;
    }

    interface HexaWebCookieStore {
        id: string;
        tabIds: number[];
        incognito?: boolean;
    }

    interface HexaWebCookiesGetDetails {
        url: string;
        name: string;
        storeId?: string;
        firstPartyDomain?: string;
        partitionKey?: HexaWebCookiePartitionKey;
    }

    interface HexaWebCookiesGetAllDetails {
        url?: string;
        domain?: string;
        path?: string;
        name?: string;
        secure?: boolean;
        session?: boolean;
        storeId?: string;
        firstPartyDomain?: string | null;
        partitionKey?: HexaWebCookiePartitionKey;
    }

    interface HexaWebCookiesSetDetails {
        url: string;
        name?: string;
        value?: string;
        domain?: string;
        path?: string;
        secure?: boolean;
        httpOnly?: boolean;
        expirationDate?: number;
        storeId?: string;
        sameSite?: HexaWebSameSiteStatus;
        firstPartyDomain?: string;
        partitionKey?: HexaWebCookiePartitionKey;
    }

    interface HexaWebCookiesRemoveDetails {
        url: string;
        name: string;
        storeId?: string;
        firstPartyDomain?: string;
        partitionKey?: HexaWebCookiePartitionKey;
    }

    interface HexaWebCookiesRemoveCallbackDetails {
        url?: string;
        name?: string;
        storeId?: string;
        firstPartyDomain?: string;
        partitionKey?: HexaWebCookiePartitionKey;
    }

    interface HexaWebCookiesOnChangedChangeInfo {
        removed: boolean;
        cookie: HexaWebCookie;
        cause: HexaWebOnChangedCause;
    }

    namespace webExt {
        namespace cookies {
            type Cookie = HexaWebCookie;
            type CookieStore = HexaWebCookieStore;
            type SameSiteStatus = HexaWebSameSiteStatus;
            type OnChangedCause = HexaWebOnChangedCause;
            type GetDetails = HexaWebCookiesGetDetails;
            type GetAllDetails = HexaWebCookiesGetAllDetails;
            type SetDetails = HexaWebCookiesSetDetails;
            type RemoveDetails = HexaWebCookiesRemoveDetails;
            type RemoveCallbackDetails = HexaWebCookiesRemoveCallbackDetails;
            type OnChangedChangeInfo = HexaWebCookiesOnChangedChangeInfo;
            function get(details: GetDetails, callback: (cookie: Cookie | null) => void): void;
            function get(details: GetDetails): Promise<Cookie | null>;
            function getAll(details: GetAllDetails, callback: (cookies: Cookie[]) => void): void;
            function getAll(details: GetAllDetails): Promise<Cookie[]>;
            function set(details: SetDetails, callback?: (cookie: Cookie | null) => void): void;
            function set(details: SetDetails): Promise<Cookie | null>;
            function remove(details: RemoveDetails, callback?: (details: RemoveCallbackDetails) => void): void;
            function remove(details: RemoveDetails): Promise<RemoveCallbackDetails>;
            function getAllCookieStores(callback: (stores: CookieStore[]) => void): void;
            function getAllCookieStores(): Promise<CookieStore[]>;
            const onChanged: {
                addListener(callback: (changeInfo: OnChangedChangeInfo) => void): void;
                removeListener(callback: (changeInfo: OnChangedChangeInfo) => void): void;
            };
        }
    }

}

export {};
