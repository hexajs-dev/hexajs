declare global {
    type HexaWebNotificationTemplateType = 'basic' | 'image' | 'list' | 'progress';

    interface HexaWebNotificationButton {
        title: string;
        iconUrl?: string;
    }

    interface HexaWebNotificationItem {
        title: string;
        message: string;
    }

    interface HexaWebNotificationOptions {
        type: HexaWebNotificationTemplateType;
        iconUrl?: string;
        appIconMaskUrl?: string;
        title?: string;
        message?: string;
        contextMessage?: string;
        priority?: number;
        eventTime?: number;
        buttons?: HexaWebNotificationButton[];
        imageUrl?: string;
        items?: HexaWebNotificationItem[];
        progress?: number;
        requireInteraction?: boolean;
        silent?: boolean;
    }

    namespace webExt {
        namespace notifications {
            function create(options: HexaWebNotificationOptions, callback?: (notificationId: string) => void): void;
            function create(options: HexaWebNotificationOptions): Promise<string>;
            function create(notificationId: string, options: HexaWebNotificationOptions, callback?: (notificationId: string) => void): void;
            function create(notificationId: string, options: HexaWebNotificationOptions): Promise<string>;
            function clear(notificationId: string, callback?: (wasCleared: boolean) => void): void;
            function clear(notificationId: string): Promise<boolean>;
            function getAll(callback?: (notifications: { [notificationId: string]: boolean }) => void): void;
            function getAll(): Promise<{ [notificationId: string]: boolean }>;
            const onClicked: { addListener(callback: (notificationId: string) => void): void; removeListener(callback: (notificationId: string) => void): void };
            const onClosed: { addListener(callback: (notificationId: string, byUser: boolean) => void): void; removeListener(callback: (notificationId: string, byUser: boolean) => void): void };
            const onButtonClicked: { addListener(callback: (notificationId: string, buttonIndex: number) => void): void; removeListener(callback: (notificationId: string, buttonIndex: number) => void): void };
        }
    }
}

export {};
