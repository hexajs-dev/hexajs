declare global {
    type HexaWebColorArray = [number, number, number, number?];
    type HexaWebImageDataType = ImageData | { [size: number]: ImageData };
    type HexaWebRunAt = 'document_start' | 'document_end' | 'document_idle';

    interface HexaWebImageDetails {
        imageData?: HexaWebImageDataType;
        path?: string | { [size: number]: string };
    }

    interface HexaWebInjectDetails {
        allFrames?: boolean;
        code?: string;
        file?: string;
        frameId?: number;
        matchAboutBlank?: boolean;
        runAt?: HexaWebRunAt;
    }
}

export {};
