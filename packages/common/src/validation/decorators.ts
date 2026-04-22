/**
 * Validation Decorators
 * These are pure metadata decorators—they do NOT enforce validation at runtime.
 * Actual validation is performed by AOT-generated validators at compile time.
 */

export function IsDefined() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as required
    };
}

export function IsOptional() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as optional
    };
}

export function IsNotEmpty() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as non-empty
    };
}

export function IsString() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as string type
    };
}

export function IsBoolean() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as boolean type
    };
}

export function IsNumber() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as number type
    };
}

export function IsInt() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as integer type
    };
}

export function IsArray() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as array type
    };
}

export function IsEmail() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as email format
    };
}

export function IsUrl() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as URL format
    };
}

export function IsUUID() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as UUID format
    };
}

export function IsJSON() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as JSON format
    };
}

export function IsUppercase() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as uppercase
    };
}

export function IsLowercase() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as lowercase
    };
}

export function IsDateString() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as date string
    };
}

export function Length(min: number, max: number) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks string length constraint (min-max)
    };
}

export function MinLength(min: number) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks minimum string length
    };
}

export function MaxLength(max: number) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks maximum string length
    };
}

export function Min(value: number) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks minimum numeric value
    };
}

export function Max(value: number) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks maximum numeric value
    };
}

export function IsPositive() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as positive number
    };
}

export function IsNegative() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as negative number
    };
}

export function Matches(pattern: RegExp | string) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as matching regex pattern
    };
}

export function Equals(value: any) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as equal to value
    };
}

export function NotEquals(value: any) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as not equal to value
    };
}

export function IsIn(values: any[]) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as one of allowed values
    };
}

export function IsNotIn(values: any[]) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as not one of forbidden values
    };
}

export function IsEmpty() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as empty
    };
}

export function IsEnum(enumClass: any) {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as enum value
    };
}

export function IsObject() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks field as object type
    };
}

export function ValidateNested() {
    return function (target: any, propertyKey: string | symbol | undefined) {
        // Metadata-only: marks nested object validation
    };
}

// Aliases for common patterns
export const StringField = IsString;
export const NumberField = IsNumber;
export const BooleanField = IsBoolean;
export const EmailField = () => IsEmail();
export const OptionalField = IsOptional;
export const RequiredField = IsDefined;
