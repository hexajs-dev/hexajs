declare global {
    interface HexaWebIdentityLaunchWebAuthFlowDetails {
        url: string;
        interactive?: boolean;
        abortOnLoadForNonInteractive?: boolean;
        timeoutMsForNonInteractive?: number;
    }

    interface HexaWebProfileUserInfo {
        id?: string;
        email?: string;
    }

    namespace webExt {
        namespace identity {
            function getRedirectURL(path?: string): string;
            function launchWebAuthFlow(details: HexaWebIdentityLaunchWebAuthFlowDetails): Promise<string>;
            function getProfileUserInfo(): Promise<HexaWebProfileUserInfo>;
            function getProfileUserInfo(profileDetails: { accountStatus?: 'ANY' | 'SYNC' }): Promise<HexaWebProfileUserInfo>;
        }
    }
}

export {};
