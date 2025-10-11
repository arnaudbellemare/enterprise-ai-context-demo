/**
 * ACE (Agentic Context Engineering) API Endpoint
 * Handles context engineering requests with evolving playbooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { ACEFramework, ACEUtils, Playbook } from '@/lib/ace-framework';

// Mock LLM model for demonstration
const mockModel = {
  generate: async (prompt: string) => {
    return `Mock LLM response for: ${prompt.substring(0, 100)}...`;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      groundTruth, 
      testResults, 
      playbookData,
      operation = 'process_query'
    } = await request.json();

    if (!query && operation === 'process_query') {
      return NextResponse.json(
        { error: 'Query is required for process_query operation' },
        { status: 400 }
      );
    }

    // Initialize ACE framework
    let aceFramework: ACEFramework;
    
    if (playbookData) {
      aceFramework = new ACEFramework(mockModel);
      aceFramework.importPlaybook(JSON.stringify(playbookData));
    } else {
      // Create initial playbook with workflow knowledge
      const initialKnowledge = [
        {
          description: "Always use proper authentication before making API calls",
          tags: ['authentication', 'api']
        },
        {
          description: "Implement pagination using while True loops instead of fixed ranges",
          tags: ['pagination', 'api']
        },
        {
          description: "Verify results against expected outcomes before completing tasks",
          tags: ['verification', 'validation']
        }
      ];
      
      const initialPlaybook = ACEUtils.createInitialPlaybook(initialKnowledge);
      aceFramework = new ACEFramework(mockModel, initialPlaybook);
    }

    let result: any = {};

    switch (operation) {
      case 'process_query':
        // Main ACE workflow: Generate -> Reflect -> Curate
        result = await aceFramework.processQuery(query, groundTruth, testResults);
        break;
        
      case 'get_playbook':
        result = { playbook: aceFramework.getPlaybook() };
        break;
        
      case 'export_playbook':
        result = { playbookJson: aceFramework.exportPlaybook() };
        break;
        
      case 'merge_playbooks':
        const { playbooks } = await request.json();
        const mergedPlaybook = ACEUtils.mergePlaybooks(playbooks);
        aceFramework.importPlaybook(JSON.stringify(mergedPlaybook));
        result = { playbook: aceFramework.getPlaybook() };
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
      playbook: aceFramework.getPlaybook(),
      stats: {
        total_bullets: aceFramework.getPlaybook().stats.total_bullets,
        helpful_bullets: aceFramework.getPlaybook().stats.helpful_bullets,
        harmful_bullets: aceFramework.getPlaybook().stats.harmful_bullets,
        last_updated: aceFramework.getPlaybook().stats.last_updated
      }
    });

  } catch (error) {
    console.error('ACE API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process ACE request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'get_playbook';

    // Initialize ACE framework with default playbook
    const initialKnowledge = [
      {
        description: "ACE Framework: Evolving contexts for self-improving language models",
        tags: ['ace', 'context_engineering', 'self_improvement']
      },
      {
        description: "Generator produces reasoning trajectories for new queries",
        tags: ['generator', 'reasoning', 'trajectory']
      },
      {
        description: "Reflector distills concrete insights from successes and errors",
        tags: ['reflector', 'insights', 'analysis']
      },
      {
        description: "Curator integrates insights into structured context updates",
        tags: ['curator', 'integration', 'context_updates']
      }
    ];
    
    const initialPlaybook = ACEUtils.createInitialPlaybook(initialKnowledge);
    const aceFramework = new ACEFramework(mockModel, initialPlaybook);

    let result: any = {};

    switch (operation) {
      case 'get_playbook':
        result = { playbook: aceFramework.getPlaybook() };
        break;
        
      case 'export_playbook':
        result = { playbookJson: aceFramework.exportPlaybook() };
        break;
        
      case 'stats':
        result = {
          stats: aceFramework.getPlaybook().stats,
          sections: Object.keys(aceFramework.getPlaybook().sections),
          total_sections: Object.keys(aceFramework.getPlaybook().sections).length
        };
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
      playbook: aceFramework.getPlaybook()
    });

  } catch (error) {
    console.error('ACE GET API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get ACE data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
