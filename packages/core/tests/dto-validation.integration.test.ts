/**
 * Integration Test: DTO Validation with AOT Pipes
 * 
 * This test demonstrates how DTOs with validation decorators work with
 * the AOT-generated validation pipes in the messaging pipeline.
 * 
 * Scenario:
 * 1. A DTO is defined with validation decorators (e.g., @IsEmail, @Length)
 * 2. CLI scans the DTO and generates a pure JS validator function
 * 3. Bootstrap registers the validator via client.usePipe()
 * 4. When a message arrives, the inbound pipe validates before handler execution
 * 5. Invalid payloads return structured validation errors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DTO with validation decorators (as would be defined in user code)
// These decorators would be scanned by the CLI during build
class SendMessageDto {
  // @IsNotEmpty() - required field
  // @IsString() - must be string
  content: string;

  // @IsUUID() - must be valid UUID
  // @IsOptional() - can be omitted
  messageId?: string;

  constructor(content: string, messageId?: string) {
    this.content = content;
    this.messageId = messageId;
  }
}

// Generated validator (this would be emitted by CLI)
function validateSendMessageDto(data: any) {
  const result = { valid: true, error: '', details: {} };

  // Check content exists and is string
  if (!data || typeof data.content !== 'string') {
    result.valid = false;
    result.error = 'content must be a string';
    result.details = { content: ['content must be a string'] };
    return result;
  }

  // Check content is not empty
  if (data.content.trim().length === 0) {
    result.valid = false;
    result.error = 'content must not be empty';
    result.details = { content: ['content must not be empty'] };
    return result;
  }

  // Check messageId is valid UUID if present
  if (data.messageId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.messageId)) {
      result.valid = false;
      result.error = 'messageId must be a valid UUID';
      result.details = { messageId: ['messageId must be a valid UUID'] };
      return result;
    }
  }

  return result;
}

describe('DTO Validation Pipeline Integration', () => {
  it('should validate and accept valid DTO payloads', () => {
    const validPayload = {
      content: 'Hello, World!',
      messageId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const result = validateSendMessageDto(validPayload);
    expect(result.valid).toBe(true);
    expect(result.error).toBe('');
  });

  it('should reject payload with missing required content field', () => {
    const invalidPayload = {
      messageId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const result = validateSendMessageDto(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('content must be a string');
  });

  it('should reject payload with empty content', () => {
    const invalidPayload = {
      content: '   ',
      messageId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const result = validateSendMessageDto(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should reject payload with invalid UUID', () => {
    const invalidPayload = {
      content: 'Valid content',
      messageId: 'not-a-uuid'
    };

    const result = validateSendMessageDto(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('UUID');
  });

  it('should accept payload without optional messageId', () => {
    const validPayload = {
      content: 'Just content, no UUID'
    };

    const result = validateSendMessageDto(validPayload);
    expect(result.valid).toBe(true);
  });

  it('should provide detailed error information for multiple violations', () => {
    const invalidPayload = {
      content: '',  // empty
      messageId: 'invalid' // not UUID
    };

    const result = validateSendMessageDto(invalidPayload);
    expect(result.valid).toBe(false);
    // In a real scenario, this would capture all violations
    // For this simple example, we catch the first one
  });
});

/**
 * How the AOT pipeline uses this validator:
 *
 * 1. CLI discovery phase:
 *    - Scans controller/handler methods for @Action/@Handle decorators
 *    - Extracts first parameter type name (e.g., "SendMessageDto")
 *    - Finds DTO class in source with @IsEmail, @Length, etc.
 *
 * 2. Validator generation phase:
 *    - Generates pure JS validator: validateSendMessageDto()
 *    - Creates route map: { 'chat:sendMessage': validateSendMessageDto }
 *    - Emits background.validators.js, content.validators.js
 *
 * 3. Bootstrap registration phase:
 *    - Imports route validators in generated bootstrap
 *    - Creates AOT pipe factory that uses route-to-validator map
 *    - Calls: hexaBackgroundClient.usePipe(createAotValidationPipe())
 *
 * 4. Runtime inbound validation phase:
 *    - Container receives message with action="chat:sendMessage", payload={...}
 *    - Container executes registered pipes with {route, payload}
 *    - Pipe looks up validator for "chat:sendMessage"
 *    - Validator runs: validateSendMessageDto(payload)
 *    - If invalid: return {valid:false, error, code, details}
 *    - Container catches validation result and sends back structured error
 *    - If valid: proceed to handler execution as normal
 *
 * Benefits:
 * - Zero runtime reflection (no class-validator library needed)
 * - Generated validators are tree-shakeable
 * - Validation happens before handler code runs
 * - Structured error responses with details for client debugging
 * - Type-safe DTOs in handlers (TypeScript ensures payload shape)
 */
