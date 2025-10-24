import { NextRequest, NextResponse } from 'next/server';
import { AutomatedUserEvaluation, UserProfile } from '../../../../lib/automated-user-evaluation';

const automatedEvaluation = new AutomatedUserEvaluation();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'register_user':
        return await registerUser(data);
      
      case 'evaluate_interaction':
        return await evaluateInteraction(data);
      
      case 'optimize_user':
        return await optimizeUser(data);
      
      case 'get_recommendations':
        return await getRecommendations(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[AutomatedUserEvaluation] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

async function registerUser(data: { profile: UserProfile }) {
  try {
    const { profile } = data;
    
    await automatedEvaluation.registerUser(profile);
    
    return NextResponse.json({
      success: true,
      message: `User ${profile.name} registered successfully`,
      data: {
        userId: profile.id,
        name: profile.name,
        preferences: profile.preferences
      }
    });
  } catch (error: any) {
    throw new Error(`Failed to register user: ${error.message}`);
  }
}

async function evaluateInteraction(data: {
  userId: string;
  task: string;
  input: any;
  output: any;
  userFeedback?: any;
}) {
  try {
    const { userId, task, input, output, userFeedback } = data;
    
    const evaluation = await automatedEvaluation.evaluateUserInteraction(
      userId, task, input, output, userFeedback
    );
    
    return NextResponse.json({
      success: true,
      data: evaluation,
      message: `Evaluation generated for user ${userId}`
    });
  } catch (error: any) {
    throw new Error(`Failed to evaluate interaction: ${error.message}`);
  }
}

async function optimizeUser(data: { userId: string }) {
  try {
    const { userId } = data;
    
    const optimization = await automatedEvaluation.optimizeForUser(userId);
    
    return NextResponse.json({
      success: true,
      data: optimization,
      message: `Optimization generated for user ${userId}`
    });
  } catch (error: any) {
    throw new Error(`Failed to optimize user: ${error.message}`);
  }
}

async function getRecommendations(data: { userId: string }) {
  try {
    const { userId } = data;
    
    const recommendations = await automatedEvaluation.getUserRecommendations(userId);
    
    return NextResponse.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    
    switch (action) {
      case 'user_stats':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter required'
          }, { status: 400 });
        }
        return await getUserStats(userId);
      
      case 'system_stats':
        return await getSystemStats();
      
      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Automated User Evaluation API',
            endpoints: {
              'POST /api/automated-user-evaluation': {
                'register_user': 'Register a new user profile',
                'evaluate_interaction': 'Evaluate user interaction automatically',
                'optimize_user': 'Optimize system for specific user',
                'get_recommendations': 'Get personalized recommendations'
              },
              'GET /api/automated-user-evaluation': {
                'user_stats': 'Get user statistics (requires userId)',
                'system_stats': 'Get system-wide statistics'
              }
            }
          }
        });
    }
  } catch (error: any) {
    console.error('[AutomatedUserEvaluation] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

async function getUserStats(userId: string) {
  try {
    const stats = automatedEvaluation.getUserStats(userId);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    throw new Error(`Failed to get user stats: ${error.message}`);
  }
}

async function getSystemStats() {
  try {
    const stats = automatedEvaluation.getSystemStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    throw new Error(`Failed to get system stats: ${error.message}`);
  }
}
