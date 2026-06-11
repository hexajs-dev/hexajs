import { describe, expect, it } from 'vitest';
import * as PublicApi from '../index';

describe('public token-export surface contract', () => {
  it('exports HEXA_PLATFORM with the correct string value', () => {
    expect((PublicApi as Record<string, unknown>).HEXA_PLATFORM).toBe('HEXA_PLATFORM');
  });

  it('exports HEXA_BUILD_MODE with the correct string value', () => {
    expect((PublicApi as Record<string, unknown>).HEXA_BUILD_MODE).toBe('HEXA_BUILD_MODE');
  });

  it('exports HEXA_DEBUG with the correct string value', () => {
    expect((PublicApi as Record<string, unknown>).HEXA_DEBUG).toBe('HEXA_DEBUG');
  });

  it('does NOT export the orphan PLATFORM token', () => {
    expect(Object.keys(PublicApi)).not.toContain('PLATFORM');
  });
});
