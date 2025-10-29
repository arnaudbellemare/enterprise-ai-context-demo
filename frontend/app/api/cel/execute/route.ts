import { NextRequest, NextResponse } from 'next/server';
import { SafeCELEvaluator } from '@/lib/safe-cel-evaluator';

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

// Safe CEL expression evaluator - Uses SafeCELEvaluator instead of Function()
async function evaluateCELExpression(expression: string, context: any): Promise<any> {
  try {
    console.log('🔍 Evaluating CEL expression:', expression);
    console.log('🔍 Context:', JSON.stringify(context, null, 2));

    // Use SafeCELEvaluator instead of Function()
    return SafeCELEvaluator.evaluate(expression, context);
  } catch (error: any) {
    throw new Error(`CEL evaluation error: ${error?.message || String(error)}`);
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

    // Evaluate the expression using safe CEL evaluator
    const result = await evaluateCELExpression(expression, context);

    // Determine if this affects global state
    let newState = { ...state };
    let routing = undefined;

    // Check if expression is setting state
    if (expression.includes('state.') && expression.includes('=')) {
      // Extract variable assignments
      const assignments = expression.match(/(\w+)\s*=\s*([^;]+)/g);
      if (assignments) {
        for (const assignment of assignments) {
          const [varName, value] = assignment.split('=').map(s => s.trim());
          newState[varName] = await evaluateCELExpression(value, context);
        }
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
