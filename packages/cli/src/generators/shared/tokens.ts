import { ConfigToken } from '../../bin/config/config';

export type GeneratorContext = 'background' | 'content' | 'ui';

export function extractTokensForContext(tokens: ConfigToken[], context: GeneratorContext): ConfigToken[] {
  return tokens.filter(token => !token.context || token.context === context);
}

export function generateTokenRegistrations(tokens: ConfigToken[]): string {
  if (tokens.length === 0) {
    return '  // No tokens to register';
  }

  const registrations: string[] = [
    `  // Register tokens`,
  ];

  tokens.forEach(token => {
    const valueStr = JSON.stringify(token.value);
    registrations.push(`  container.register(${JSON.stringify(token.key)}, () => ${valueStr});`);
  });

  return registrations.join('\n');
}
