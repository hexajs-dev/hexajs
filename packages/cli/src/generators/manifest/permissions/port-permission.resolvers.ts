import { PortPermissionPatch, PortPermissionResolver } from './types';

abstract class BasePortPermissionResolver implements PortPermissionResolver {
    protected constructor(private readonly portClassName: string) {}

    supports(portName: string): boolean {
        return portName === this.portClassName;
    }

    resolve(platform: string): PortPermissionPatch {
        if (!this.isSupportedPlatform(platform)) {
            return {};
        }

        return this.getPatch();
    }

    protected isSupportedPlatform(_platform: string): boolean {
        return true;
    }

    protected abstract getPatch(): PortPermissionPatch;
}

export class ClipboardPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('ClipboardPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['clipboardRead', 'clipboardWrite'] };
    }
}

export class DownloadsPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('DownloadsPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['downloads'] };
    }
}

export class NotificationsPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('NotificationsPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['notifications'] };
    }
}

export class CookiesPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('CookiesPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['cookies'] };
    }
}

export class HistoryPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('HistoryPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['history'] };
    }
}

export class BookmarksPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('BookmarksPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['bookmarks'] };
    }
}

export class ManagementPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('ManagementPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['management'] };
    }
}

export class IdlePortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('IdlePort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['idle'] };
    }
}

export class PermissionsPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('PermissionsPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['permissions'] };
    }
}

export class ScriptingPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('ScriptingPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['scripting'] };
    }
}

export class WebRequestPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('WebRequestPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['webRequest'] };
    }
}

export class DeclarativeNetRequestPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('DeclarativeNetRequestPort');
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['declarativeNetRequest'] };
    }
}

const USER_SCRIPTS_SUPPORTED_PLATFORMS = new Set<string>([
    'chrome',
    'edge',
    'brave',
    'opera',
    'firefox',
]);

export class UserScriptsPortPermissionResolver extends BasePortPermissionResolver {
    constructor() {
        super('UserScriptsPort');
    }

    protected isSupportedPlatform(platform: string): boolean {
        return USER_SCRIPTS_SUPPORTED_PLATFORMS.has(platform);
    }

    protected getPatch(): PortPermissionPatch {
        return { permissions: ['userScripts'] };
    }
}

export function createDefaultPortPermissionResolvers(): PortPermissionResolver[] {
    return [
        new ClipboardPortPermissionResolver(),
        new DownloadsPortPermissionResolver(),
        new NotificationsPortPermissionResolver(),
        new CookiesPortPermissionResolver(),
        new HistoryPortPermissionResolver(),
        new BookmarksPortPermissionResolver(),
        new ManagementPortPermissionResolver(),
        new IdlePortPermissionResolver(),
        new PermissionsPortPermissionResolver(),
        new ScriptingPortPermissionResolver(),
        new WebRequestPortPermissionResolver(),
        new DeclarativeNetRequestPortPermissionResolver(),
        new UserScriptsPortPermissionResolver(),
    ];
}
