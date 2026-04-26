# @hexajs-dev/core

Core contracts, decorators, and Dependency Injection for HexaJS.

## Dependency Injection

### Basic Usage

```typescript
import { Injectable, inject, InjectionContext } from '@hexajs-dev/core';

// Service without context (can be injected anywhere)
@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

// Service with Content context
@Injectable({ context: InjectionContext.Content })
export class ContentService {
  constructor(private logger: LoggerService) {}

  doSomething() {
    this.logger.log('Content service doing something');
  }
}

// Service with Background context
@Injectable({ context: InjectionContext.Background })
export class BackgroundService {
  constructor(private logger: LoggerService) {}

  doSomething() {
    this.logger.log('Background service doing something');
  }
}

// Usage
const contentService = inject(ContentService);
const backgroundService = inject(BackgroundService);
```

### Context Boundaries

Services can only inject dependencies from the same context, unless the dependency has no context (undefined), in which case it can be injected anywhere.

```typescript
// ✅ Allowed: Content service injecting global service
@Injectable({ context: InjectionContext.Content })
export class ContentService {
  constructor(private logger: LoggerService) {} // LoggerService has no context
}

// ✅ Allowed: Content service injecting Content service
@Injectable({ context: InjectionContext.Content })
export class ContentService {
  constructor(private otherContent: OtherContentService) {} // Same context
}

// ❌ Error: Content service cannot inject Background service
@Injectable({ context: InjectionContext.Content })
export class ContentService {
  constructor(private background: BackgroundService) {} // Different context - ERROR!
}
```

### Validation Rules

1. **@Injectable Required**: All services must be decorated with `@Injectable()` to be injectable.
2. **Context Boundaries**: Services cannot inject dependencies from different contexts (unless the dependency has no context).

## API

### `Injectable(options?: InjectableOptions)`

Decorator that marks a class as injectable.

- `options.context?: InjectionContext` - Optional context for the service

### `inject<T>(ServiceClass: new (...args: any[]) => T): T`

Injects a service instance. Creates the instance if it doesn't exist, otherwise returns the existing singleton.

### `InjectionContext`

Enum defining available injection contexts:
- `InjectionContext.Content` - Content script context
- `InjectionContext.Background` - Background script context

### `setInjectionContext(context: InjectionContext)`

Sets the current injection context (useful for runtime context detection).

### `clearContainer()`

Clears all services (useful for testing).
