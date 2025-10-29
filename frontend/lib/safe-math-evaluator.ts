/**
 * Safe Math Evaluator
 * 
 * Provides secure evaluation of mathematical expressions without using eval() or Function()
 * Supports basic arithmetic operations, parentheses, and common math functions
 */

interface EvaluationResult {
  result: number;
  error?: string;
}

/**
 * Token types for parsing mathematical expressions
 */
type TokenType = 'NUMBER' | 'OPERATOR' | 'FUNCTION' | 'LEFT_PAREN' | 'RIGHT_PAREN' | 'VARIABLE';

interface Token {
  type: TokenType;
  value: string | number;
}

/**
 * Safe mathematical expression evaluator
 * 
 * Supports:
 * - Basic arithmetic: +, -, *, /, %
 * - Exponentiation: ^ or **
 * - Parentheses: ()
 * - Common functions: sin, cos, tan, sqrt, log, exp, abs, round, floor, ceil, min, max
 * - Constants: pi, e
 * 
 * Does NOT support:
 * - Arbitrary code execution
 * - Variable assignments
 * - Function definitions
 */
export class SafeMathEvaluator {
  private static readonly OPERATORS = ['+', '-', '*', '/', '%', '^', '**'];
  private static readonly FUNCTIONS = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'sqrt', 'cbrt',
    'log', 'log10', 'ln', 'exp',
    'abs', 'round', 'floor', 'ceil', 'trunc',
    'min', 'max',
    'pow'
  ];
  private static readonly CONSTANTS: Record<string, number> = {
    'pi': Math.PI,
    'e': Math.E,
    'E': Math.E,
  };

  /**
   * Evaluate a mathematical expression safely
   */
  static evaluate(expression: string, variables?: Record<string, number>): EvaluationResult {
    try {
      // Clean and validate input
      const cleaned = this.cleanExpression(expression);
      if (!cleaned) {
        return { result: 0, error: 'Empty expression' };
      }

      // Tokenize
      const tokens = this.tokenize(cleaned);
      if (tokens.length === 0) {
        return { result: 0, error: 'No valid tokens found' };
      }

      // Parse and evaluate
      const result = this.evaluateTokens(tokens, variables || {});
      
      if (isNaN(result) || !isFinite(result)) {
        return { result: 0, error: 'Result is not a number or is infinite' };
      }

      return { result };
    } catch (error) {
      return {
        result: 0,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      };
    }
  }

  /**
   * Clean and validate expression
   */
  private static cleanExpression(expression: string): string {
    // Remove all whitespace
    let cleaned = expression.replace(/\s+/g, '');
    
    // Replace ** with ^ for consistent handling
    cleaned = cleaned.replace(/\*\*/g, '^');
    
    // Validate: only allow numbers, operators, parentheses, letters (for functions), and dots/commas
    if (!/^[0-9+\-*/().,a-z^% ]+$/i.test(cleaned)) {
      throw new Error('Expression contains invalid characters');
    }

    return cleaned;
  }

  /**
   * Tokenize expression into numbers, operators, functions, and parentheses
   */
  private static tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expression.length) {
      const char = expression[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Number (including decimals)
      if (/[\d.]/.test(char)) {
        let numStr = '';
        while (i < expression.length && /[\d.]/.test(expression[i])) {
          numStr += expression[i];
          i++;
        }
        const num = parseFloat(numStr);
        if (isNaN(num)) {
          throw new Error(`Invalid number: ${numStr}`);
        }
        tokens.push({ type: 'NUMBER', value: num });
        continue;
      }

      // Function name
      if (/[a-z]/i.test(char)) {
        let funcName = '';
        while (i < expression.length && /[a-z]/i.test(expression[i])) {
          funcName += expression[i];
          i++;
        }
        
        // Check if it's a constant
        if (this.CONSTANTS[funcName.toLowerCase()] !== undefined) {
          tokens.push({ type: 'NUMBER', value: this.CONSTANTS[funcName.toLowerCase()] });
        } else if (this.FUNCTIONS.includes(funcName.toLowerCase())) {
          tokens.push({ type: 'FUNCTION', value: funcName.toLowerCase() });
        } else {
          // Variable
          tokens.push({ type: 'VARIABLE', value: funcName });
        }
        continue;
      }

      // Operators
      if (this.OPERATORS.includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'LEFT_PAREN', value: '(' });
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RIGHT_PAREN', value: ')' });
        i++;
        continue;
      }

      // Unknown character
      throw new Error(`Unexpected character: ${char}`);
    }

    return tokens;
  }

  /**
   * Evaluate tokens using recursive descent parsing
   */
  private static evaluateTokens(tokens: Token[], variables: Record<string, number>): number {
    let index = 0;

    const parseExpression = (): number => {
      return parseAddition();
    };

    const parseAddition = (): number => {
      let left = parseMultiplication();
      while (index < tokens.length) {
        const token = tokens[index];
        if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
          index++;
          const right = parseMultiplication();
          if (token.value === '+') {
            left += right;
          } else {
            left -= right;
          }
        } else {
          break;
        }
      }
      return left;
    };

    const parseMultiplication = (): number => {
      let left = parsePower();
      while (index < tokens.length) {
        const token = tokens[index];
        if (token.type === 'OPERATOR' && (token.value === '*' || token.value === '/' || token.value === '%')) {
          index++;
          const right = parsePower();
          if (token.value === '*') {
            left *= right;
          } else if (token.value === '/') {
            if (right === 0) {
              throw new Error('Division by zero');
            }
            left /= right;
          } else {
            left %= right;
          }
        } else {
          break;
        }
      }
      return left;
    };

    const parsePower = (): number => {
      let left = parseFactor();
      while (index < tokens.length) {
        const token = tokens[index];
        if (token.type === 'OPERATOR' && token.value === '^') {
          index++;
          const right = parseFactor();
          left = Math.pow(left, right);
        } else {
          break;
        }
      }
      return left;
    };

    const parseFactor = (): number => {
      if (index >= tokens.length) {
        throw new Error('Unexpected end of expression');
      }

      const token = tokens[index];

      // Number
      if (token.type === 'NUMBER') {
        index++;
        return token.value as number;
      }

      // Variable
      if (token.type === 'VARIABLE') {
        index++;
        const varName = token.value as string;
        if (variables[varName] === undefined) {
          throw new Error(`Undefined variable: ${varName}`);
        }
        return variables[varName];
      }

      // Unary minus
      if (token.type === 'OPERATOR' && token.value === '-') {
        index++;
        return -parseFactor();
      }

      // Function call
      if (token.type === 'FUNCTION') {
        const funcName = token.value as string;
        index++;
        
        // Expect opening parenthesis
        if (index >= tokens.length || tokens[index].type !== 'LEFT_PAREN') {
          throw new Error(`Expected '(' after function ${funcName}`);
        }
        index++;

        // Parse arguments (comma-separated)
        const args: number[] = [];
        if (tokens[index].type !== 'RIGHT_PAREN') {
          args.push(parseExpression());
          while (index < tokens.length && tokens[index].type === 'OPERATOR' && tokens[index].value === ',') {
            index++;
            args.push(parseExpression());
          }
        }

        // Expect closing parenthesis
        if (index >= tokens.length || tokens[index].type !== 'RIGHT_PAREN') {
          throw new Error(`Expected ')' after function ${funcName} arguments`);
        }
        index++;

        return this.evaluateFunction(funcName, args);
      }

      // Parentheses
      if (token.type === 'LEFT_PAREN') {
        index++;
        const result = parseExpression();
        if (index >= tokens.length || tokens[index].type !== 'RIGHT_PAREN') {
          throw new Error('Expected closing parenthesis');
        }
        index++;
        return result;
      }

      throw new Error(`Unexpected token: ${token.type} = ${token.value}`);
    };

    return parseExpression();
  }

  /**
   * Evaluate a mathematical function
   */
  private static evaluateFunction(name: string, args: number[]): number {
    const funcMap: Record<string, (...args: number[]) => number> = {
      'sin': (x) => Math.sin(x),
      'cos': (x) => Math.cos(x),
      'tan': (x) => Math.tan(x),
      'asin': (x) => Math.asin(x),
      'acos': (x) => Math.acos(x),
      'atan': (x) => Math.atan(x),
      'sinh': (x) => Math.sinh(x),
      'cosh': (x) => Math.cosh(x),
      'tanh': (x) => Math.tanh(x),
      'sqrt': (x) => {
        if (x < 0) throw new Error('Square root of negative number');
        return Math.sqrt(x);
      },
      'cbrt': (x) => Math.cbrt(x),
      'log': (x) => {
        if (x <= 0) throw new Error('Logarithm of non-positive number');
        return Math.log(x);
      },
      'log10': (x) => {
        if (x <= 0) throw new Error('Logarithm of non-positive number');
        return Math.log10(x);
      },
      'ln': (x) => {
        if (x <= 0) throw new Error('Logarithm of non-positive number');
        return Math.log(x);
      },
      'exp': (x) => Math.exp(x),
      'abs': (x) => Math.abs(x),
      'round': (x) => Math.round(x),
      'floor': (x) => Math.floor(x),
      'ceil': (x) => Math.ceil(x),
      'trunc': (x) => Math.trunc(x),
      'min': (...xs) => Math.min(...xs),
      'max': (...xs) => Math.max(...xs),
      'pow': (x, y) => Math.pow(x, y),
    };

    const func = funcMap[name.toLowerCase()];
    if (!func) {
      throw new Error(`Unknown function: ${name}`);
    }

    // Validate argument count for functions with fixed arity
    const singleArgFunctions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
                              'sqrt', 'cbrt', 'log', 'log10', 'ln', 'exp', 'abs', 'round', 'floor', 'ceil', 'trunc'];
    if (singleArgFunctions.includes(name.toLowerCase()) && args.length !== 1) {
      throw new Error(`Function ${name} expects 1 argument, got ${args.length}`);
    }

    return func(...args);
  }
}

/**
 * Convenience function for evaluating simple expressions
 */
export function safeEvaluate(expression: string, variables?: Record<string, number>): number {
  const result = SafeMathEvaluator.evaluate(expression, variables);
  if (result.error) {
    throw new Error(result.error);
  }
  return result.result;
}

