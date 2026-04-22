export interface UrlRule {
  domain: string;
}

export interface ClipVaultConfig {
  privacy: {
    domainScoped: boolean;
    sensitiveDetection: boolean;
    autoExpire: boolean;
    autoExpireDays: number;
  };
  storage: {
    maxItems: number;
  };
  urlRules: {
    exclude: UrlRule[];
  };
  theme: 'light' | 'dark';
}

export const DEFAULT_CONFIG: ClipVaultConfig = {
  privacy: {
    domainScoped: true,
    sensitiveDetection: true,
    autoExpire: false,
    autoExpireDays: 30,
  },
  storage: {
    maxItems: 100,
  },
  urlRules: {
    exclude: [],
  },
  theme: 'dark',
};

export const SENSITIVE_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{36,}/,
  /gho_[a-zA-Z0-9]{36,}/,
  /github_pat_[a-zA-Z0-9_]{22,}/,
  /Bearer\s+[a-zA-Z0-9._\-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}/,
  /[a-zA-Z0-9+/]{40,}={0,2}/,
  /xox[bpras]-[a-zA-Z0-9\-]{10,}/,
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
];

export const CONFIG_STORAGE_KEY = 'clip-vault.config';
export const CLIPS_STORAGE_KEY = 'clip-vault.clips';
