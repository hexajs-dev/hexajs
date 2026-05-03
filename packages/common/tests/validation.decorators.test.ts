import { describe, expect, it } from 'vitest';
import {
  BooleanField,
  EmailField,
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  OptionalField,
  RequiredField,
  StringField,
} from '../src/validation/decorators';

describe('validation decorators metadata contract', () => {
  it('returns callable property decorators for core validators', () => {
    const target = {};

    const decorators = [
      IsDefined(),
      IsOptional(),
      IsString(),
      IsEmail(),
      Length(1, 100),
      EmailField(),
    ];

    decorators.forEach((decorator) => {
      expect(typeof decorator).toBe('function');
      expect(() => decorator(target, 'field')).not.toThrow();
    });
  });

  it('keeps alias exports mapped to primary decorators', () => {
    expect(StringField).toBe(IsString);
    expect(BooleanField.name).toBe('IsBoolean');
    expect(OptionalField).toBe(IsOptional);
    expect(RequiredField).toBe(IsDefined);
  });
});
