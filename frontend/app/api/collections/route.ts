import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with proper error handling
let supabase: any = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('⚠️ Supabase not configured - using in-memory fallback');
  }
} catch (error) {
  console.warn('⚠️ Supabase initialization failed:', error);
}

// GET - List all collections for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If Supabase is not configured, return a fallback response
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured - using in-memory fallback',
        data: { collections: [] }
      });
    }

    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        memories:memories(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      collections: collections.map((col: any) => ({
        id: col.id,
        name: col.name,
        description: col.description,
        metadata: col.metadata,
        memoriesCount: col.memories?.[0]?.count || 0,
        createdAt: col.created_at,
        updatedAt: col.updated_at,
      })),
      total: collections.length,
    });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST - Create a new collection
export async function POST(req: NextRequest) {
  try {
    const { name, description, metadata = {}, userId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If Supabase is not configured, return a fallback response
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured - using in-memory fallback',
        data: { collection: { id: 'fallback', name, description, metadata, userId } }
      });
    }

    // Check if collection already exists
    const { data: existing } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Collection with this name already exists' },
        { status: 409 }
      );
    }

    // Create new collection
    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        user_id: userId,
        name,
        description,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        metadata: collection.metadata,
        createdAt: collection.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a collection
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!collectionId || !userId) {
      return NextResponse.json(
        { error: 'Collection ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete collection (memories will be set to null due to ON DELETE SET NULL)
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

// PATCH - Update a collection
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, description, metadata, userId } = await req.json();

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Collection ID and User ID are required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (metadata !== undefined) updates.metadata = metadata;

    // Update collection
    const { data: collection, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        metadata: collection.metadata,
        updatedAt: collection.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update collection' },
      { status: 500 }
    );
  }
}

