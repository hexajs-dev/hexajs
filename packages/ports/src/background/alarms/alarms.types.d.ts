declare global {
    interface HexaWebAlarmCreateInfo {
        when?: number;
        delayInMinutes?: number;
        periodInMinutes?: number;
    }

    interface HexaWebAlarm {
        name: string;
        scheduledTime: number;
        periodInMinutes?: number;
    }

    namespace webExt {
        namespace alarms {
            function create(name?: string, alarmInfo?: HexaWebAlarmCreateInfo): void;
            function get(name: string, callback?: (alarm?: HexaWebAlarm) => void): void;
            function get(name: string): Promise<HexaWebAlarm | undefined>;
            function getAll(callback?: (alarms: HexaWebAlarm[]) => void): void;
            function getAll(): Promise<HexaWebAlarm[]>;
            function clear(name?: string, callback?: (wasCleared: boolean) => void): void;
            function clear(name?: string): Promise<boolean>;
            function clearAll(callback?: (wasCleared: boolean) => void): void;
            function clearAll(): Promise<boolean>;
            const onAlarm: { addListener(callback: (alarm: HexaWebAlarm) => void): void; removeListener(callback: (alarm: HexaWebAlarm) => void): void };
        }
    }
}

export {};
