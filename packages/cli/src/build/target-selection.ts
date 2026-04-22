import { BuildTarget } from './types';

export function shouldRunStage(target: BuildTarget, stage: Exclude<BuildTarget, 'all'>): boolean {
    return target === 'all' || target === stage;
}

export function shouldWriteStoreForTarget(target: BuildTarget, context: string): boolean {
    if (target === 'all') {
        return true;
    }
    if (target === 'background' && context === 'background') {
        return true;
    }
    if (target === 'content' && context === 'content') {
        return true;
    }
    return false;
}
