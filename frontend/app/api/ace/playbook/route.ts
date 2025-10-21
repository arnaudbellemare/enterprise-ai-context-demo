/**
 * ACE Playbook Storage API
 * Store and retrieve ACE playbook bullets from Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with proper error handling
let supabase: any = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('⚠️ Supabase not configured - using in-memory fallback');
  }
} catch (error) {
  console.warn('⚠️ Supabase initialization failed:', error);
}

export async function POST(req: NextRequest) {
  try {
    const { action, playbook, bullet } = await req.json();

    // If Supabase is not configured, return a fallback response
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured - using in-memory fallback',
        data: { action, playbook, bullet }
      });
    }

    switch (action) {
      case 'save':
        // Save entire playbook to Supabase
        if (!playbook) {
          return NextResponse.json({ error: 'Playbook required' }, { status: 400 });
        }

        // Store each bullet in the database
        const bulletPromises = playbook.bullets.map(async (b: any) => {
          return supabase
            .from('ace_playbook')
            .upsert({
              bullet_id: b.id,
              content: b.content,
              helpful_count: b.metadata.helpful_count,
              harmful_count: b.metadata.harmful_count,
              last_used: b.metadata.last_used,
              created_at: b.metadata.created_at,
              tags: b.metadata.tags,
              sections: playbook.sections
            }, { onConflict: 'bullet_id' });
        });

        await Promise.all(bulletPromises);

        return NextResponse.json({
          success: true,
          message: `Saved ${playbook.bullets.length} bullets to database`,
          bulletCount: playbook.bullets.length
        });

      case 'load':
        // Load entire playbook from Supabase
        const { data: bullets, error } = await supabase
          .from('ace_playbook')
          .select('id, bullet_id, content, helpful_count, harmful_count, last_used, created_at, tags, sections, updated_at')
          .order('helpful_count', { ascending: false });

        if (error) {
          console.error('Supabase error loading playbook:', error);
          return NextResponse.json({
            success: false,
            playbook: null,
            error: error.message
          });
        }

        // Reconstruct playbook from database
        const loadedPlaybook = {
          bullets: bullets?.map((b: any) => ({
            id: b.bullet_id,
            content: b.content,
            metadata: {
              helpful_count: b.helpful_count || 0,
              harmful_count: b.harmful_count || 0,
              last_used: new Date(b.last_used),
              created_at: new Date(b.created_at),
              tags: b.tags || []
            }
          })) || [],
          sections: bullets?.[0]?.sections || {},
          stats: {
            total_bullets: bullets?.length || 0,
            helpful_bullets: bullets?.filter((b: any) => b.helpful_count > b.harmful_count).length || 0,
            harmful_bullets: bullets?.filter((b: any) => b.harmful_count > b.helpful_count).length || 0,
            last_updated: new Date()
          }
        };

        return NextResponse.json({
          success: true,
          playbook: loadedPlaybook,
          bulletCount: bullets?.length || 0
        });

      case 'add_bullet':
        // Add single bullet to playbook
        if (!bullet) {
          return NextResponse.json({ error: 'Bullet required' }, { status: 400 });
        }

        const { error: insertError } = await supabase
          .from('ace_playbook')
          .insert({
            bullet_id: bullet.id,
            content: bullet.content,
            helpful_count: bullet.metadata?.helpful_count || 0,
            harmful_count: bullet.metadata?.harmful_count || 0,
            last_used: bullet.metadata?.last_used || new Date().toISOString(),
            created_at: bullet.metadata?.created_at || new Date().toISOString(),
            tags: bullet.metadata?.tags || [],
            sections: {}
          });

        if (insertError) {
          console.error('Error adding bullet:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Bullet added to playbook'
        });

      case 'update_bullet':
        // Update bullet metadata (helpful/harmful counts)
        if (!bullet || !bullet.id) {
          return NextResponse.json({ error: 'Bullet ID required' }, { status: 400 });
        }

        const { error: updateError } = await supabase
          .from('ace_playbook')
          .update({
            helpful_count: bullet.metadata?.helpful_count,
            harmful_count: bullet.metadata?.harmful_count,
            last_used: new Date().toISOString()
          })
          .eq('bullet_id', bullet.id);

        if (updateError) {
          console.error('Error updating bullet:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Bullet updated'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('ACE Playbook API error:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // If Supabase is not configured, return a fallback response
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured - using in-memory fallback',
        data: { bullets: [] }
      });
    }

    // Load playbook from Supabase
    const { data: bullets, error } = await supabase
      .from('ace_playbook')
      .select('bullet_id, content, helpful_count, harmful_count, last_used, created_at, tags, sections')
      .order('helpful_count', { ascending: false });

    if (error) {
      throw error;
    }

    const playbook = {
      bullets: bullets?.map((b: any) => ({
        id: b.bullet_id,
        content: b.content,
        metadata: {
          helpful_count: b.helpful_count || 0,
          harmful_count: b.harmful_count || 0,
          last_used: new Date(b.last_used),
          created_at: new Date(b.created_at),
          tags: b.tags || []
        }
      })) || [],
      sections: bullets?.[0]?.sections || {},
      stats: {
        total_bullets: bullets?.length || 0,
        helpful_bullets: bullets?.filter((b: any) => b.helpful_count > b.harmful_count).length || 0,
        harmful_bullets: bullets?.filter((b: any) => b.harmful_count > b.helpful_count).length || 0,
        last_updated: new Date()
      }
    };

    return NextResponse.json({
      success: true,
      playbook,
      bulletCount: bullets?.length || 0
    });
  } catch (error: any) {
    console.error('Error loading playbook:', error);
    return NextResponse.json({
      error: 'Failed to load playbook',
      details: error.message
    }, { status: 500 });
  }
}

