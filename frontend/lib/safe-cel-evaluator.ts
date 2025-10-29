/**
 * Safe CEL (Common Expression Language) Evaluator
 * 
 * Provides safer evaluation of CEL-like expressions without using Function() or eval()
 * Supports basic operations, variable access, and state management
 * 
 * NOTE: For production use, consider using @google-cloud/cel or a proper CEL parser
 */

import { SafeMathEvaluator } from './safe-math-evaluator';

interface EvaluationContext {
  input?: any;
  state?: Record<string, any>;
  workflow?: Record<string, any>;
  variables?: Record<string, any>;
}

/**
 * Safe CEL expression evaluator
 * 
 * Supports:
 * - Property access: state.key, input.value, workflow.property
 * - Basic comparisons: ==, !=, <, >, <=, >=
 * - Logical operators: &&, ||, !
 * - Arithmetic: +, -, *, /, %
 * - String operations: contains, size
 * - Array operations: in, size
 * - State assignments: state.key = value
 * - Functions: now(), size(), contains()
 * 
 * Does NOT support:
 * - Arbitrary code execution
 * - Function definitions
 * - Prototype manipulation
 */
export class SafeCELEvaluator {
  /**
   * Evaluate a CEL expression safely
   */
  static evaluate(expression: string, context: EvaluationContext): any {
    try {
      // Clean expression
      const cleaned = expression.trim();
      
      // Handle multiple statements (semicolon-separated)
      if (cleaned.includes(';')) {
        const statements = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0);
        let lastResult = null;
        for (const statement of statements) {
          lastResult = this.evaluateSingleExpression(statement, context);
        }
        return lastResult;
      }

      return this.evaluateSingleExpression(cleaned, context);
    } catch (error) {
      throw new Error(`CEL evaluation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Evaluate a single CEL expression
   */
  private static evaluateSingleExpression(expression: string, context: EvaluationContext): any {
    // Handle state assignments
    if (expression.includes('=')) {
      return this.handleAssignment(expression, context);
    }

    // Handle comparisons and logical operators
    if (/[<>=!&|]/.test(expression)) {
      return this.handleComparison(expression, context);
    }

    // Handle arithmetic expressions
    if (/[+\-*/%]/.test(expression)) {
      return this.handleArithmetic(expression, context);
    }

    // Handle function calls
    if (expression.includes('(')) {
      return this.handleFunctionCall(expression, context);
    }

    // Handle property access
    if (expression.includes('.')) {
      return this.handlePropertyAccess(expression, context);
    }

    // Handle literal values
    return this.parseLiteral(expression);
  }

  /**
   * Handle state assignments: state.key = value
   */
  private static handleAssignment(expression: string, context: EvaluationContext): any {
    const match = expression.match(/^(state\.\w+)\s*=\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid assignment syntax: ${expression}`);
    }

    const key = match[1].replace('state.', '');
    const valueExpr = match[2].trim();

    // Evaluate the right side
    const value = this.evaluateSingleExpression(valueExpr, context);

    // Set in context.state
    if (!context.state) {
      context.state = {};
    }
    context.state[key] = value;

    return value;
  }

  /**
   * Handle comparisons: ==, !=, <, >, <=, >=
   */
  private static handleComparison(expression: string, context: EvaluationContext): boolean {
    // Extract comparison operators (preserving them)
    const operators = ['<=', '>=', '==', '!=', '<', '>', '&&', '||'];
    
    // Find the operator
    let operator: string | null = null;
    let operatorIndex = -1;
    
    for (const op of operators) {
      const index = expression.indexOf(op);
      if (index !== -1 && (operatorIndex === -1 || index < operatorIndex)) {
        operator = op;
        operatorIndex = index;
      }
    }

    if (!operator || operatorIndex === -1) {
      // Might be a logical NOT
      if (expression.trim().startsWith('!')) {
        const operand = expression.trim().substring(1).trim();
        return !this.toBoolean(this.evaluateSingleExpression(operand, context));
      }
      throw new Error(`No comparison operator found in: ${expression}`);
    }

    const leftExpr = expression.substring(0, operatorIndex).trim();
    const rightExpr = expression.substring(operatorIndex + operator.length).trim();

    const left = this.evaluateSingleExpression(leftExpr, context);
    const right = this.evaluateSingleExpression(rightExpr, context);

    switch (operator) {
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        return this.toNumber(left) < this.toNumber(right);
      case '>':
        return this.toNumber(left) > this.toNumber(right);
      case '<=':
        return this.toNumber(left) <= this.toNumber(right);
      case '>=':
        return this.toNumber(left) >= this.toNumber(right);
      case '&&':
        return this.toBoolean(left) && this.toBoolean(right);
      case '||':
        return this.toBoolean(left) || this.toBoolean(right);
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Handle arithmetic expressions using safe math evaluator
   */
  private static handleArithmetic(expression: string, context: EvaluationContext): number {
    // Replace property accesses with their values
    let processed = expression;
    
    // Replace state.*, input.*, workflow.* with their actual values
    processed = processed.replace(/state\.(\w+)/g, (_, key) => {
      const value = context.state?.[key];
      return value !== undefined ? String(value) : '0';
    });
    
    processed = processed.replace(/input\.(\w+)/g, (_, key) => {
      const value = context.input?.[key];
      return value !== undefined ? String(value) : '0';
    });
    
    processed = processed.replace(/workflow\.(\w+)/g, (_, key) => {
      const value = context.workflow?.[key];
      return value !== undefined ? String(value) : '0';
    });

    // Use safe math evaluator
    const result = SafeMathEvaluator.evaluate(processed, context.variables || {});
    
    if (result.error) {
      throw new Error(`Arithmetic evaluation failed: ${result.error}`);
    }
    
    return result.result;
  }

  /**
   * Handle function calls: now(), size(), contains()
   */
  private static handleFunctionCall(expression: string, context: EvaluationContext): any {
    const match = expression.match(/^(\w+)\(([^)]*)\)$/);
    if (!match) {
      throw new Error(`Invalid function call syntax: ${expression}`);
    }

    const funcName = match[1];
    const argsStr = match[2];

    // Parse arguments (comma-separated)
    const args: any[] = [];
    if (argsStr.trim()) {
      // Simple argument parsing (handles strings, numbers, property access)
      const argParts = this.splitArguments(argsStr);
      for (const arg of argParts) {
        args.push(this.evaluateSingleExpression(arg.trim(), context));
      }
    }

    return this.callFunction(funcName, args, context);
  }

  /**
   * Split function arguments (handles quoted strings)
   */
  private static splitArguments(argsStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === ',' && !inQuotes) {
        args.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      args.push(current);
    }

    return args;
  }

  /**
   * Call a CEL function
   */
  private static callFunction(name: string, args: any[], context: EvaluationContext): any {
    switch (name.toLowerCase()) {
      case 'now':
        return new Date().toISOString();
      
      case 'size':
        if (args.length !== 1) {
          throw new Error(`size() expects 1 argument, got ${args.length}`);
        }
        const arg = args[0];
        if (Array.isArray(arg)) {
          return arg.length;
        }
        if (typeof arg === 'string') {
          return arg.length;
        }
        if (typeof arg === 'object' && arg !== null) {
          return Object.keys(arg).length;
        }
        throw new Error(`size() expects array, string, or object, got ${typeof arg}`);
      
      case 'contains':
        if (args.length !== 2) {
          throw new Error(`contains() expects 2 arguments, got ${args.length}`);
        }
        const container = args[0];
        const item = args[1];
        
        if (typeof container === 'string') {
          return container.includes(String(item));
        }
        if (Array.isArray(container)) {
          return container.includes(item);
        }
        throw new Error(`contains() expects string or array as first argument`);
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  /**
   * Handle property access: state.key, input.value, workflow.property
   */
  private static handlePropertyAccess(expression: string, context: EvaluationContext): any {
    const parts = expression.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid property access: ${expression} (only supports single-level access)`);
    }

    const [namespace, key] = parts;

    switch (namespace) {
      case 'state':
        return context.state?.[key];
      case 'input':
        return context.input?.[key];
      case 'workflow':
        return context.workflow?.[key];
      case 'variables':
        return context.variables?.[key];
      default:
        throw new Error(`Unknown namespace: ${namespace}`);
    }
  }

  /**
   * Parse literal values (strings, numbers, booleans)
   */
  private static parseLiteral(expression: string): any {
    const trimmed = expression.trim();

    // Boolean literals
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    // String literals
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Number literals
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // Not a literal, might be a variable name (will be handled by caller)
    return trimmed;
  }

  /**
   * Convert value to boolean
   */
  private static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0 && value.toLowerCase() !== 'false';
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    return Boolean(value);
  }

  /**
   * Convert value to number
   */
  private static toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (isNaN(num)) throw new Error(`Cannot convert to number: ${value}`);
      return num;
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    throw new Error(`Cannot convert to number: ${typeof value}`);
  }
}

