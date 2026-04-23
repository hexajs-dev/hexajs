const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const LOOPBACK_SOCKET_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function normalizeHost(host: string): string {
    const trimmed = host.trim().toLowerCase();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

export function formatHostForUrl(host: string): string {
    return host.includes(':') ? `[${host}]` : host;
}

export function assertLoopbackHost(host: string, label: string): string {
    const normalized = normalizeHost(host);
    if (!LOOPBACK_HOSTS.has(normalized)) {
        throw new Error(`${label} must use a loopback host. Received "${host}".`);
    }
    return normalized;
}

export function isLoopbackSocketAddress(address: string | null | undefined): boolean {
    if (!address) {
        return false;
    }
    return LOOPBACK_SOCKET_ADDRESSES.has(normalizeHost(address));
}

export function assertLocalPort(port: number, label: string): number {
    if (!Number.isInteger(port) || port < 0 || port > 65535 || (port !== 0 && port < 1024)) {
        throw new Error(`${label} must be 0 or a non-privileged TCP port between 1024 and 65535. Received "${port}".`);
    }
    return port;
}

export function normalizeLoopbackWebSocketOrigin(address: string, label: string): string {
    let url: URL;
    try {
        url = new URL(address);
    } catch {
        throw new Error(`${label} must be a valid WebSocket URL. Received "${address}".`);
    }

    if (url.protocol !== 'ws:') {
        throw new Error(`${label} must use the ws:// scheme. Received "${address}".`);
    }

    const host = assertLoopbackHost(url.hostname, label);
    if (!url.port) {
        throw new Error(`${label} must include an explicit port. Received "${address}".`);
    }

    const port = assertLocalPort(Number(url.port), label);
    if (url.username || url.password || (url.pathname && url.pathname !== '/') || url.search || url.hash) {
        throw new Error(`${label} must be a bare loopback origin without credentials, path, query, or hash. Received "${address}".`);
    }

    return `ws://${formatHostForUrl(host)}:${port}`;
}