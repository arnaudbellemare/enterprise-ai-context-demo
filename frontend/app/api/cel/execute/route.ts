import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * CEL (Common Expression Language) Execution API
 * 
 * Supports:
 * - Data transformation and manipulation
 * - Conditional routing and logic
 * - Global state management
 * - Variable access and calculations
 */

interface CELRequest {
  expression: string;
  variables?: Record<string, any>;
  state?: Record<string, any>;
  previousData?: any;
  workflowContext?: Record<string, any>;
}

interface CELResponse {
  result: any;
  newState?: Record<string, any>;
  variables?: Record<string, any>;
  routing?: {
    nextNode?: string;
    condition?: string;
  };
}

// Simple CEL-like expression evaluator
function evaluateCELExpression(expression: string, context: any): any {
  try {
    console.log('🔍 Evaluating CEL expression:', expression);
    console.log('🔍 Context:', JSON.stringify(context, null, 2));

    // Handle multi-statement expressions (separated by semicolons)
    const statements = expression.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    if (statements.length > 1) {
      // Execute multiple statements and return the last result
      let lastResult = null;
      for (const statement of statements) {
        lastResult = evaluateSingleExpression(statement.trim(), context);
      }
      return lastResult;
    } else {
      // Single expression
      return evaluateSingleExpression(expression, context);
    }
  } catch (error: any) {
    throw new Error(`CEL evaluation error: ${error?.message || String(error)}`);
  }
}

function evaluateSingleExpression(expression: string, context: any): any {
  // Replace CEL-style variable access with JavaScript
  let jsExpression = expression
    .replace(/state\./g, 'context.state?.')
    .replace(/input\./g, 'context.input?.')
    .replace(/workflow\./g, 'context.workflow?.')
    .replace(/now\(\)/g, 'new Date().toISOString()')
    .replace(/\[(\w+)\]/g, '["$1"]');

  // Handle common CEL functions
  jsExpression = jsExpression
    .replace(/size\(/g, 'Object.keys(')
    .replace(/contains\(/g, 'String(')
    .replace(/all\(/g, 'Array.from(')
    .replace(/in /g, 'includes(');

  console.log('🔍 Converted to JS:', jsExpression);

  // Create safe evaluation context
  const safeContext = {
    ...context,
    Math,
    String,
    Array,
    Object,
    JSON,
    Date
  };

  // Handle assignment expressions
  if (jsExpression.includes('=')) {
    const [left, right] = jsExpression.split('=').map(s => s.trim());
    
    // Execute the right side
    const rightFunc = new Function('context', `with(context) { return ${right}; }`);
    const value = rightFunc(safeContext);
    
    // Set the left side
    const leftPath = left.replace('context.state?.', 'context.state.');
    const setFunc = new Function('context', 'value', `
      const parts = "${leftPath}".split('.');
      let obj = context;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return value;
    `);
    
    return setFunc(safeContext, value);
  } else {
    // Simple expression evaluation
    const func = new Function('context', `with(context) { return ${jsExpression}; }`);
    return func(safeContext);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CELRequest = await request.json();
    const { expression, variables = {}, state = {}, previousData, workflowContext = {} } = body;

    if (!expression || typeof expression !== 'string') {
      return NextResponse.json(
        { error: 'CEL expression is required' },
        { status: 400 }
      );
    }

    console.log('🧮 Executing CEL expression:', expression);

    // Prepare evaluation context
    const context = {
      input: previousData,
      state,
      workflow: workflowContext,
      variables,
      // Add helper functions
      Math,
      String,
      Array,
      Object,
      JSON,
      Date
    };

    // Evaluate the expression
    const result = evaluateCELExpression(expression, context);

    // Determine if this affects global state
    let newState = { ...state };
    let routing = undefined;

    // Check if expression is setting state
    if (expression.includes('state.') && expression.includes('=')) {
      // Extract variable assignments
      const assignments = expression.match(/(\w+)\s*=\s*([^;]+)/g);
      if (assignments) {
        assignments.forEach(assignment => {
          const [varName, value] = assignment.split('=').map(s => s.trim());
          newState[varName] = evaluateCELExpression(value, context);
        });
      }
    }

    // Check if this is a conditional routing expression
    if (expression.includes('route') || expression.includes('if')) {
      routing = {
        nextNode: result?.nextNode || result?.route || undefined,
        condition: expression
      };
    }

    const response: CELResponse = {
      result,
      newState: Object.keys(newState).length > 0 ? newState : undefined,
      variables,
      routing
    };

    console.log('✅ CEL result:', result);
    if (newState && Object.keys(newState).length > 0) {
      console.log('📝 New state:', newState);
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ CEL execution error:', error);
    return NextResponse.json(
      { 
        error: 'CEL execution failed',
        details: error.message,
        result: null 
      },
      { status: 500 }
    );
  }
}
