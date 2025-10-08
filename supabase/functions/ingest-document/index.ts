import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentChunk {
  content: string;
  index: number;
}

// Function to split document into chunks
function chunkDocument(text: string, chunkSize: number = 1000, overlap: number = 200): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);
    
    chunks.push({
      content: chunk,
      index: index++,
    });

    start += chunkSize - overlap;
  }

  return chunks;
}

// Function to generate embeddings using OpenAI
async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { documentId, userId } = await req.json();

    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get document from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // 2. Get document content from storage
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('documents')
      .download(document.storage_path);

    if (storageError || !fileData) {
      throw new Error('Failed to download document');
    }

    // Convert blob to text
    const content = await fileData.text();

    // 3. Split document into chunks
    const chunks = chunkDocument(content);

    // 4. Process each chunk and create memories
    const memoryPromises = chunks.map(async (chunk) => {
      // Generate embedding for chunk
      const embedding = await generateEmbedding(chunk.content, openaiKey);

      // Insert memory
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          user_id: userId,
          collection_id: document.collection_id,
          content: chunk.content,
          embedding: embedding,
          source: 'document',
          content_type: document.file_type || 'text',
          status: 'ready',
          metadata: {
            document_id: documentId,
            chunk_index: chunk.index,
            filename: document.filename,
          },
        })
        .select()
        .single();

      if (memoryError) {
        console.error('Error creating memory:', memoryError);
        throw memoryError;
      }

      // Link chunk to document
      await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          memory_id: memory.id,
          chunk_index: chunk.index,
          content: chunk.content,
        });

      return memory;
    });

    // Wait for all chunks to be processed
    const memories = await Promise.all(memoryPromises);

    // 5. Update document status to ready
    await supabase
      .from('documents')
      .update({ 
        status: 'ready',
        chunks_count: chunks.length,
      })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        chunksProcessed: chunks.length,
        memoriesCreated: memories.length,
        message: 'Document processed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error processing document:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process document',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

