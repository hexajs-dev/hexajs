---
title: Decorators (common)
description: Public API model reference for common module packages/common/src/validation/decorators.ts.
---


#### @Equals

```ts
import { Equals } from '@hexajs-dev/common';
```

```typescript
@Equals(value: any)
```

#### @IsArray

```ts
import { IsArray } from '@hexajs-dev/common';
```

```typescript
@IsArray()
```

#### @IsBoolean

```ts
import { IsBoolean } from '@hexajs-dev/common';
```

```typescript
@IsBoolean()
```

#### @IsDateString

```ts
import { IsDateString } from '@hexajs-dev/common';
```

```typescript
@IsDateString()
```

#### @IsDefined

Validation Decorators
These are pure metadata decorators—they do NOT enforce validation at runtime.
Actual validation is performed by AOT-generated validators at compile time.

```ts
import { IsDefined } from '@hexajs-dev/common';
```

```typescript
@IsDefined()
```

#### @IsEmail

```ts
import { IsEmail } from '@hexajs-dev/common';
```

```typescript
@IsEmail()
```

#### @IsEmpty

```ts
import { IsEmpty } from '@hexajs-dev/common';
```

```typescript
@IsEmpty()
```

#### @IsEnum

```ts
import { IsEnum } from '@hexajs-dev/common';
```

```typescript
@IsEnum(enumClass: any)
```

#### @IsIn

```ts
import { IsIn } from '@hexajs-dev/common';
```

```typescript
@IsIn(values: any[])
```

#### @IsInt

```ts
import { IsInt } from '@hexajs-dev/common';
```

```typescript
@IsInt()
```

#### @IsJSON

```ts
import { IsJSON } from '@hexajs-dev/common';
```

```typescript
@IsJSON()
```

#### @IsLowercase

```ts
import { IsLowercase } from '@hexajs-dev/common';
```

```typescript
@IsLowercase()
```

#### @IsNegative

```ts
import { IsNegative } from '@hexajs-dev/common';
```

```typescript
@IsNegative()
```

#### @IsNotEmpty

```ts
import { IsNotEmpty } from '@hexajs-dev/common';
```

```typescript
@IsNotEmpty()
```

#### @IsNotIn

```ts
import { IsNotIn } from '@hexajs-dev/common';
```

```typescript
@IsNotIn(values: any[])
```

#### @IsNumber

```ts
import { IsNumber } from '@hexajs-dev/common';
```

```typescript
@IsNumber()
```

#### @IsObject

```ts
import { IsObject } from '@hexajs-dev/common';
```

```typescript
@IsObject()
```

#### @IsOptional

```ts
import { IsOptional } from '@hexajs-dev/common';
```

```typescript
@IsOptional()
```

#### @IsPositive

```ts
import { IsPositive } from '@hexajs-dev/common';
```

```typescript
@IsPositive()
```

#### @IsString

```ts
import { IsString } from '@hexajs-dev/common';
```

```typescript
@IsString()
```

#### @IsUppercase

```ts
import { IsUppercase } from '@hexajs-dev/common';
```

```typescript
@IsUppercase()
```

#### @IsUrl

```ts
import { IsUrl } from '@hexajs-dev/common';
```

```typescript
@IsUrl()
```

#### @IsUUID

```ts
import { IsUUID } from '@hexajs-dev/common';
```

```typescript
@IsUUID()
```

#### @Length

```ts
import { Length } from '@hexajs-dev/common';
```

```typescript
@Length(min: number, max: number)
```

#### @Matches

```ts
import { Matches } from '@hexajs-dev/common';
```

```typescript
@Matches(pattern: RegExp | string)
```

#### @Max

```ts
import { Max } from '@hexajs-dev/common';
```

```typescript
@Max(value: number)
```

#### @MaxLength

```ts
import { MaxLength } from '@hexajs-dev/common';
```

```typescript
@MaxLength(max: number)
```

#### @Min

```ts
import { Min } from '@hexajs-dev/common';
```

```typescript
@Min(value: number)
```

#### @MinLength

```ts
import { MinLength } from '@hexajs-dev/common';
```

```typescript
@MinLength(min: number)
```

#### @NotEquals

```ts
import { NotEquals } from '@hexajs-dev/common';
```

```typescript
@NotEquals(value: any)
```

#### @ValidateNested

```ts
import { ValidateNested } from '@hexajs-dev/common';
```

```typescript
@ValidateNested()
```


### Functions

#### EmailField

```ts
import { EmailField } from '@hexajs-dev/common';
```

```typescript
function EmailField(): () => (target: any, propertyKey: string | symbol | undefined) => void
```


### Constants

#### BooleanField

```ts
import { BooleanField } from '@hexajs-dev/common';
```

```typescript
const BooleanField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### NumberField

```ts
import { NumberField } from '@hexajs-dev/common';
```

```typescript
const NumberField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### OptionalField

```ts
import { OptionalField } from '@hexajs-dev/common';
```

```typescript
const OptionalField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### RequiredField

```ts
import { RequiredField } from '@hexajs-dev/common';
```

```typescript
const RequiredField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### StringField

```ts
import { StringField } from '@hexajs-dev/common';
```

```typescript
const StringField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

