import * as ts from 'typescript';
import { WorkerMetadata } from './types';
import { evalNode, findDecorator } from '../../shared/props.methods';
import { DIScanner } from '../../di/scanner';

export class WorkerScanner {
  constructor(private checker: ts.TypeChecker, private diScanner: DIScanner) {}

  public scan(node: ts.Node): WorkerMetadata | null {
    if (ts.isClassDeclaration(node) && node.name) {
      return this.processClass(node);
    }
    return null;
  }

  private processClass(node: ts.ClassDeclaration): WorkerMetadata | null {
    const workerDecorator = findDecorator(node, this.checker, 'Worker', ['@hexajs/core']);
    if (!workerDecorator) return null;

    const options = this.extractWorkerOptions(workerDecorator);
    if (!options || !options.name) return null;

    const { dependencies, tokenDependencies } = this.diScanner.extractConstructorDeps(node);
    const publicMethods = this.collectPublicMethods(node);

    return {
      className: node.name!.text,
      name: options.name,
      environment: options.environment ?? 'compute',
      importPath: node.getSourceFile().fileName,
      dependencies,
      tokenDependencies,
      publicMethods,
    };
  }

  private extractWorkerOptions(decorator: ts.Decorator): { name: string; environment?: string } | null {
    if (!ts.isCallExpression(decorator.expression)) return null;
    const arg = decorator.expression.arguments[0];
    if (!arg || !ts.isObjectLiteralExpression(arg)) return null;

    const nameProp = arg.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText() === 'name');
    const envProp = arg.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText() === 'environment');

    const name = nameProp && ts.isPropertyAssignment(nameProp) ? evalNode(this.checker, nameProp.initializer) : undefined;
    const environment = envProp && ts.isPropertyAssignment(envProp) ? evalNode(this.checker, envProp.initializer) : undefined;

    if (typeof name !== 'string') return null;
    return { name, environment: typeof environment === 'string' ? environment : undefined };
  }

  private collectPublicMethods(node: ts.ClassDeclaration): string[] {
    const methods: string[] = [];
    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member)) continue;
      if (!member.name || !ts.isIdentifier(member.name)) continue;

      const name = member.name.text;
      if (name === 'constructor' || name === 'onInit' || name === 'onDestroy') continue;

      const hasPrivate = member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword);
      const hasProtected = member.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword);
      if (hasPrivate || hasProtected) continue;

      methods.push(name);
    }
    return methods;
  }
}
