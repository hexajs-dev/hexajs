---
title: Decorators (common)
description: Public API model reference for common module packages/common/src/validation/decorators.ts.
---


#### @Equals

```ts
import { Equals } from '@hexajs/common';
```

```typescript
@Equals(value: any)
```

#### @IsArray

```ts
import { IsArray } from '@hexajs/common';
```

```typescript
@IsArray()
```

#### @IsBoolean

```ts
import { IsBoolean } from '@hexajs/common';
```

```typescript
@IsBoolean()
```

#### @IsDateString

```ts
import { IsDateString } from '@hexajs/common';
```

```typescript
@IsDateString()
```

#### @IsDefined

Validation Decorators
These are pure metadata decorators—they do NOT enforce validation at runtime.
Actual validation is performed by AOT-generated validators at compile time.

```ts
import { IsDefined } from '@hexajs/common';
```

```typescript
@IsDefined()
```

#### @IsEmail

```ts
import { IsEmail } from '@hexajs/common';
```

```typescript
@IsEmail()
```

#### @IsEmpty

```ts
import { IsEmpty } from '@hexajs/common';
```

```typescript
@IsEmpty()
```

#### @IsEnum

```ts
import { IsEnum } from '@hexajs/common';
```

```typescript
@IsEnum(enumClass: any)
```

#### @IsIn

```ts
import { IsIn } from '@hexajs/common';
```

```typescript
@IsIn(values: any[])
```

#### @IsInt

```ts
import { IsInt } from '@hexajs/common';
```

```typescript
@IsInt()
```

#### @IsJSON

```ts
import { IsJSON } from '@hexajs/common';
```

```typescript
@IsJSON()
```

#### @IsLowercase

```ts
import { IsLowercase } from '@hexajs/common';
```

```typescript
@IsLowercase()
```

#### @IsNegative

```ts
import { IsNegative } from '@hexajs/common';
```

```typescript
@IsNegative()
```

#### @IsNotEmpty

```ts
import { IsNotEmpty } from '@hexajs/common';
```

```typescript
@IsNotEmpty()
```

#### @IsNotIn

```ts
import { IsNotIn } from '@hexajs/common';
```

```typescript
@IsNotIn(values: any[])
```

#### @IsNumber

```ts
import { IsNumber } from '@hexajs/common';
```

```typescript
@IsNumber()
```

#### @IsObject

```ts
import { IsObject } from '@hexajs/common';
```

```typescript
@IsObject()
```

#### @IsOptional

```ts
import { IsOptional } from '@hexajs/common';
```

```typescript
@IsOptional()
```

#### @IsPositive

```ts
import { IsPositive } from '@hexajs/common';
```

```typescript
@IsPositive()
```

#### @IsString

```ts
import { IsString } from '@hexajs/common';
```

```typescript
@IsString()
```

#### @IsUppercase

```ts
import { IsUppercase } from '@hexajs/common';
```

```typescript
@IsUppercase()
```

#### @IsUrl

```ts
import { IsUrl } from '@hexajs/common';
```

```typescript
@IsUrl()
```

#### @IsUUID

```ts
import { IsUUID } from '@hexajs/common';
```

```typescript
@IsUUID()
```

#### @Length

```ts
import { Length } from '@hexajs/common';
```

```typescript
@Length(min: number, max: number)
```

#### @Matches

```ts
import { Matches } from '@hexajs/common';
```

```typescript
@Matches(pattern: RegExp | string)
```

#### @Max

```ts
import { Max } from '@hexajs/common';
```

```typescript
@Max(value: number)
```

#### @MaxLength

```ts
import { MaxLength } from '@hexajs/common';
```

```typescript
@MaxLength(max: number)
```

#### @Min

```ts
import { Min } from '@hexajs/common';
```

```typescript
@Min(value: number)
```

#### @MinLength

```ts
import { MinLength } from '@hexajs/common';
```

```typescript
@MinLength(min: number)
```

#### @NotEquals

```ts
import { NotEquals } from '@hexajs/common';
```

```typescript
@NotEquals(value: any)
```

#### @ValidateNested

```ts
import { ValidateNested } from '@hexajs/common';
```

```typescript
@ValidateNested()
```


### Functions

#### EmailField

```ts
import { EmailField } from '@hexajs/common';
```

```typescript
function EmailField(): () => (target: any, propertyKey: string | symbol | undefined) => void
```


### Constants

#### BooleanField

```ts
import { BooleanField } from '@hexajs/common';
```

```typescript
const BooleanField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### NumberField

```ts
import { NumberField } from '@hexajs/common';
```

```typescript
const NumberField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### OptionalField

```ts
import { OptionalField } from '@hexajs/common';
```

```typescript
const OptionalField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### RequiredField

```ts
import { RequiredField } from '@hexajs/common';
```

```typescript
const RequiredField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

#### StringField

```ts
import { StringField } from '@hexajs/common';
```

```typescript
const StringField: () => (target: any, propertyKey: string | symbol | undefined) => void;
```

