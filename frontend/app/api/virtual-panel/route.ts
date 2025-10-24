import { NextRequest, NextResponse } from 'next/server';
import { VirtualPanelSystem, PersonaProfile } from '../../../../lib/virtual-panel-system';

const virtualPanel = new VirtualPanelSystem();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add_persona':
        return await addPersona(data);
      
      case 'process_task':
        return await processTask(data);
      
      case 'get_stats':
        return await getStats();
      
      case 'get_persona_performance':
        return await getPersonaPerformance(data.personaId);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[VirtualPanel] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

async function addPersona(data: { profile: PersonaProfile; calibrationData: any[] }) {
  try {
    const { profile, calibrationData } = data;
    
    await virtualPanel.addPersona(profile, calibrationData);
    
    return NextResponse.json({
      success: true,
      message: `Persona "${profile.name}" added successfully`,
      data: {
        personaId: profile.id,
        name: profile.name,
        role: profile.role,
        expertise: profile.expertise
      }
    });
  } catch (error: any) {
    throw new Error(`Failed to add persona: ${error.message}`);
  }
}

async function processTask(data: { 
  task: string; 
  input: any; 
  options?: {
    includePersonas?: string[];
    consensusThreshold?: number;
    enableJudgeEvaluation?: boolean;
  }
}) {
  try {
    const { task, input, options } = data;
    
    const result = await virtualPanel.processTask(task, input, options);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Task processed through ${result.metadata.personaCount} personas`
    });
  } catch (error: any) {
    throw new Error(`Failed to process task: ${error.message}`);
  }
}

async function getStats() {
  try {
    const stats = virtualPanel.getPanelStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    throw new Error(`Failed to get stats: ${error.message}`);
  }
}

async function getPersonaPerformance(personaId: string) {
  try {
    const performance = virtualPanel.getPersonaPerformance(personaId);
    
    return NextResponse.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    throw new Error(`Failed to get persona performance: ${error.message}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'stats':
        return await getStats();
      
      case 'personas':
        const stats = virtualPanel.getPanelStats();
        return NextResponse.json({
          success: true,
          data: {
            personas: stats.personas,
            count: stats.personaCount
          }
        });
      
      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Virtual Panel System API',
            endpoints: {
              'POST /api/virtual-panel': {
                'add_persona': 'Add a new persona to the panel',
                'process_task': 'Process a task through the virtual panel',
                'get_stats': 'Get panel statistics',
                'get_persona_performance': 'Get performance metrics for a persona'
              },
              'GET /api/virtual-panel': {
                'stats': 'Get panel statistics',
                'personas': 'Get list of personas'
              }
            }
          }
        });
    }
  } catch (error: any) {
    console.error('[VirtualPanel] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
