import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const collection = formData.get('collection') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 1. Get or create collection if specified
    let collectionId = null;
    if (collection) {
      const { data: existingCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId)
        .eq('name', collection)
        .single();

      if (existingCollection) {
        collectionId = existingCollection.id;
      } else {
        const { data: newCollection, error: collectionError } = await supabase
          .from('collections')
          .insert({
            user_id: userId,
            name: collection,
            description: `Auto-created collection: ${collection}`,
          })
          .select('id')
          .single();

        if (collectionError) throw collectionError;
        collectionId = newCollection.id;
      }
    }

    // 2. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        collection_id: collectionId,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        status: 'uploading',
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (docError) {
      // Cleanup uploaded file if document creation fails
      await supabase.storage.from('documents').remove([fileName]);
      throw docError;
    }

    // 4. Trigger background processing
    const { data: processData, error: processError } = await supabase.functions.invoke(
      'ingest-document',
      {
        body: {
          documentId: document.id,
          userId: userId,
        },
      }
    );

    if (processError) {
      console.error('Background processing error:', processError);
      // Don't fail the upload, just log the error
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          error_message: processError.message
        })
        .eq('id', document.id);
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      filename: file.name,
      status: 'processing',
      message: 'Document uploaded and processing started',
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to upload document' 
      },
      { status: 500 }
    );
  }
}

