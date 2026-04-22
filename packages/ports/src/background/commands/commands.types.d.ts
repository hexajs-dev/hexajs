declare global {
    interface HexaWebCommand {
        name?: string;
        description?: string;
        shortcut?: string;
    }

    namespace webExt {
        namespace commands {
            function getAll(callback?: (commands: HexaWebCommand[]) => void): void;
            function getAll(): Promise<HexaWebCommand[]>;
            const onCommand: { addListener(callback: (command: string) => void): void; removeListener(callback: (command: string) => void): void };
        }
    }
}

export {};
