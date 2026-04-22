declare global {
    interface HexaWebRuntimeConnectInfo {
        name?: string;
        includeTlsChannelId?: boolean;
    }

    interface HexaWebRuntimeMessageOptions {
        includeTlsChannelId?: boolean;
    }
}

export {};
