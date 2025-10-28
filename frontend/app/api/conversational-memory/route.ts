/**
 * Conversational Memory System API
 * 
 * Direct access to memory operations without going through the full pipeline.
 * Useful for:
 * - Testing memory retrieval
 * - Manual memory management
 * - Memory inspection/debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationalMemory } from '../../../lib/conversational-memory-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, query, conversationText, memoryId, category, limit } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'search':
        {
          if (!query) {
            return NextResponse.json(
              { error: 'query is required for search' },
              { status: 400 }
            );
          }

          const memories = await conversationalMemory.searchMemories(
            userId,
            query,
            limit || 5,
            category
          );

          return NextResponse.json({
            success: true,
            action: 'search',
            results: memories.length,
            memories
          });
        }

      case 'process':
        {
          if (!conversationText) {
            return NextResponse.json(
              { error: 'conversationText is required for processing' },
              { status: 400 }
            );
          }

          const result = await conversationalMemory.processConversation(
            userId,
            conversationText
          );

          return NextResponse.json({
            success: true,
            action: 'process',
            operations: result.operations,
            updatedMemories: result.updatedMemories
          });
        }

      case 'getAllMemories':
        {
          const allMemories = await conversationalMemory.getAllMemories(userId);

          return NextResponse.json({
            success: true,
            action: 'getAllMemories',
            count: allMemories.length,
            memories: allMemories
          });
        }

      case 'deleteMemory':
        {
          if (!memoryId) {
            return NextResponse.json(
              { error: 'memoryId is required for deletion' },
              { status: 400 }
            );
          }

          await conversationalMemory.deleteMemory(memoryId);

          return NextResponse.json({
            success: true,
            action: 'deleteMemory',
            memoryId
          });
        }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Conversational Memory API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const allMemories = await conversationalMemory.getAllMemories(userId);

    return NextResponse.json({
      success: true,
      userId,
      count: allMemories.length,
      memories: allMemories
    });
  } catch (error: any) {
    console.error('Conversational Memory API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

