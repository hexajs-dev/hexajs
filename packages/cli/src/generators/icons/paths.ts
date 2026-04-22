import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { ResolvedBuildConfig } from '../../bin/config/resolve';

export function resolveCoreDefaultIconPath(): string | undefined {
    try {
        const userRequire = createRequire(path.join(process.cwd(), 'package.json'));
        const corePackageJsonPath = userRequire.resolve('@hexajs/core/package.json');
        const candidate = path.join(path.dirname(corePackageJsonPath), 'assets', 'hexa-logo.svg');
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    } catch {
        return undefined;
    }
    return undefined;
}

export function resolveUsedIconPath(resolved: ResolvedBuildConfig): { path: string | null; fromFramework: boolean } {
    const configured = resolved.ui?.popup?.icons ? path.resolve(process.cwd(), resolved.ui.popup.icons) : null;
    if (configured && fs.existsSync(configured) && fs.statSync(configured).isFile()) {
        return { path: configured, fromFramework: false };
    }

    const frameworkDefault = resolveCoreDefaultIconPath();
    if (frameworkDefault) {
        return { path: frameworkDefault, fromFramework: true };
    }

    return { path: null, fromFramework: false };
}
