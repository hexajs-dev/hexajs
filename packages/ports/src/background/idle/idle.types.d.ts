declare global {
    type HexaWebIdleState = 'active' | 'idle' | 'locked';

    namespace webExt {
        namespace idle {
            function queryState(detectionIntervalInSeconds: number): Promise<HexaWebIdleState>;
            function setDetectionInterval(intervalInSeconds: number): void;
            const onStateChanged: { addListener(callback: (newState: HexaWebIdleState) => void): void; removeListener(callback: (newState: HexaWebIdleState) => void): void };
        }
    }
}

export {};
