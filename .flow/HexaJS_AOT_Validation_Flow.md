# HexaJS AOT Validation Flow: Concept & Implementation Guide

This document outlines the architectural flow for implementing Ahead-of-Time (AOT) validation within the HexaJS framework. This strategy eliminates runtime reflection and heavy validation libraries, favoring generated, optimized code for browser extensions.

---

## Phase 1: Definition (The DTO)
**Location:** `@hexajs-dev/common`
**Actor:** Developer

The developer defines a Data Transfer Object (DTO) using standard HexaJS decorators. These decorators serve as metadata for the AOT engine.

```typescript
// @hexajs-dev/common/dto/user.dto.ts
import { IsEmail, IsString, Length } from '@hexajs-dev/common';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 20)
  password: string;
}
```

---

## Phase 2: Discovery & Analysis
**Location:** `hexa-cli`
**Actor:** AOT Analyzer (AST Scanner)

The CLI performs a static analysis of the source code during the build process.
1. **Scan `@Action` Handlers:** Identify all methods decorated with `@Action`.
2. **Parameter Inspection:** Check the first parameter of the method. If the type matches a class defined in `@hexajs-dev/common` with validation decorators, mark it for processing.
3. **DTO Extraction:** Read the properties and decorators of the identified DTO.

---

## Phase 3: Validation Code Generation
**Location:** `hexa-cli/transformers`
**Actor:** Code Generator

Instead of shipping `class-validator` to the browser, the CLI generates a "pure" JavaScript validation function for each DTO.

**Conceptual Output (Internal):**
```javascript
// Generated: CreateUserDto_validator.js
export function validateCreateUserDto(data) {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid payload' };
  
  // IsEmail logic
  const emailRegex = /^[\^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return { valid: false, error: 'Invalid email' };
  
  // Length logic
  if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 20) {
    return { valid: false, error: 'Password must be 8-20 chars' };
  }
  
  return { valid: true };
}
```

---

## Phase 4: The Injection (The "Pipe" Wrap)
**Location:** `hexa-cli/build-engine`
**Actor:** Code Inserter

The CLI modifies the final output of the `@Action` handler to include a call to the generated validator *before* the business logic runs.

**Original Code:**
```typescript
@Action('user:register')
async register(payload: CreateUserDto) {
  this.userService.save(payload);
}
```

**Post-AOT Injected Code:**
```javascript
// Final bundle output
async register(payload) {
  const check = validateCreateUserDto(payload); // Injected by AOT
  if (!check.valid) {
     console.error('HexaJS Validation Failed:', check.error);
     return; // Halt execution
  }
  this.userService.save(payload);
}
```

---

## Phase 5: Runtime Execution
**Location:** Browser (Background/Content)
**Actor:** HexaJS Engine

1. **Receive:** A message arrives via the Message Bus.
2. **Validate:** The injected validator runs instantly (No reflection, no library overhead).
3. **Execute:** If valid, the controller method is called. If invalid, the framework prevents the action and (optionally) logs the failure.

---

## Benefits for "Proper" Architecture:
- **Zero-Byte Library:** Only the specific validation logic used is shipped.
- **Content Script Performance:** Minimal CPU cycles required for validation.
- **Strict Contracts:** Forces clean communication between Background and Content scripts.



🛠 Supported Decorators (The AOT Filter)Here is the list of decorators we will support in @hexajs-dev/common. These were selected to ensure a small bundle size while providing full coverage for extension messaging:CategoryDecoratorsCommonIsDefined, IsOptional, Equals, NotEquals, IsEmpty, IsNotEmpty, IsIn, IsNotInTypeIsBoolean, IsString, IsNumber, IsInt, IsArray, IsEnum, IsObjectStringIsEmail, IsUrl, IsUUID, IsJSON, IsLowercase, IsUppercase, Length, MinLength, MaxLength, Matches (Regex)NumberMin, Max, IsPositive, IsNegativeDateIsDateString (Crucial for JSON-serialized dates)NestedValidateNested (Triggers AOT validation for child DTOs)📝 Content of the HexaJS_AOT_Validation_Flow.mdMarkdown# HexaJS AOT Validation Flow: Concept & Implementation Guide

This document defines the architectural flow for Ahead-of-Time (AOT) validation. 
The goal: **Zero Runtime Reflection.**

---

## 1. The Core Decorator Registry
The following decorators are supported and will be recognized by the `hexa-cli` AST analyzer.

### Structural
- `@IsDefined()`, `@IsOptional()`, `@IsNotEmpty()`, `@IsIn(values[])`

### Primitive Types
- `@IsString()`, `@IsNumber()`, `@IsInt()`, `@IsBoolean()`, `@IsArray()`, `@IsObject()`

### Format Validation
- `@IsEmail()`, `@IsUrl()`, `@IsUUID()`, `@IsDateString()`, `@Matches(regex)`

### Constraints
- `@Min(n)`, `@Max(n)`, `@Length(min, max)`, `@MinLength(n)`, `@MaxLength(n)`

### Composition
- `@ValidateNested()`: Tells the AOT engine to look for a validator for the property's type.

---

## 2. Step-by-Step Architecture Flow

### Step 1: Definition (Developer)
Developer creates a DTO in `@hexajs-dev/common`.
```typescript
export class SendMessageDto {
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}
Step 2: Static Analysis (CLI)The hexa-cli parses the project.It identifies every @Action(name) parameter type.It looks up the class definition in the project's metadata map.It maps every decorator to its corresponding JavaScript logic.Step 3: Function Generation (CLI)The CLI generates a lightweight validation manifest.Instead of importing class-validator, it creates a pure function:JavaScriptconst validateSendMessageDto = (data) => {
  if (typeof data.id !== 'string' || !uuidRegex.test(data.id)) return false;
  if (typeof data.content !== 'string' || data.content.length > 500) return false;
  return true;
};
Step 4: The Bridge Wrap (AOT Injection)During the build of the Background or Content scripts, the CLI wraps the handler:JavaScript// Post-AOT Result
async onMessageReceived(payload) {
  if (!validateSendMessageDto(payload)) throw new Error("Validation Failed");
  return await originalHandler(payload);