/**
 * Document Ingestion with Contextual Chunk Enrichment
 * 
 * This endpoint processes documents with contextual chunk enrichment during preprocessing.
 * 
 * Process:
 * 1. Split document into chunks
 * 2. For each chunk, generate contextual information using LLM
 * 3. Prepend context to chunk: "Context + Chunk"
 * 4. Generate embeddings from enriched content (not original)
 * 5. Store enriched chunks in database
 * 
 * This follows the research pattern: "Adding context to chunks improves retrieval accuracy a lot"
 */

import { NextRequest, NextResponse } from 'next/server';
import { createContextualChunkEnricher } from '@/lib/rag/contextual-chunk-enrichment';
import { embeddingService } from '@/lib/embedding-service';
import { pseStorageService, initializePSEStorage } from '@/lib/gamp/pse-storage-service';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Handle FormData (file upload) or JSON
    const contentType = req.headers.get('content-type') || '';
    let document: string = '';
    let documentId: string = '';
    let userId: string = 'default';
    let enableEnrichment = true;
    let chunkSize = 1000;
    let overlap = 200;
    let documentMetadata: any = {};
    let fileName = 'uploaded-document.txt';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const enableEnrichmentStr = formData.get('enableEnrichment') as string;
      
      if (!file) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        );
      }

      document = await file.text();
      fileName = file.name;
      enableEnrichment = enableEnrichmentStr === 'true';
      documentMetadata = {
        filename: file.name,
        type: file.type,
        size: file.size,
      };
    } else {
      const body = await req.json();
      document = body.document || '';
      documentId = body.documentId || '';
      userId = body.userId || 'default';
      enableEnrichment = body.enableEnrichment !== false;
      chunkSize = body.chunkSize || 1000;
      overlap = body.overlap || 200;
      documentMetadata = body.documentMetadata || {};
    }

    if (!document || typeof document !== 'string' || document.length === 0) {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    console.log('📚 Processing document with contextual chunk enrichment...');
    console.log(`   Document length: ${document.length} characters`);
    console.log(`   Enrichment: ${enableEnrichment ? 'enabled' : 'disabled'}`);

    // Step 1: Split document into chunks
    const chunks = chunkDocument(document, chunkSize, overlap);
    console.log(`   ✅ Split into ${chunks.length} chunks`);

    // Step 2: Enrich chunks with contextual information (if enabled)
    const enricher = createContextualChunkEnricher('gemma3:4b');
    
    const enrichedChunks = enableEnrichment
      ? await enricher.enrichChunks(chunks, document, {
          enabled: true,
          documentMetadata,
        })
      : chunks.map(chunk => ({
          ...chunk,
          originalContent: chunk.content,
          context: '',
          enrichedContent: chunk.content,
          problemSolutionEffect: undefined,
        }));

    console.log(`   ✅ Enriched ${enrichedChunks.length} chunks`);

    // Step 3: Generate embeddings for enriched chunks
    // IMPORTANT: Embeddings are generated from enriched content, not original
    const chunksWithEmbeddings = await enricher.generateEmbeddingsForEnrichedChunks(enrichedChunks);

    console.log(`   ✅ Generated embeddings for ${chunksWithEmbeddings.length} chunks`);

    // Step 4: Store P-S-E triplets in database (if Supabase available)
    const generatedDocumentId = documentId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let tripletsStored = 0;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        initializePSEStorage(supabase);
        
        // Store triplets that were extracted during enrichment
        const tripletsToStore = enrichedChunks
          .filter((chunk): chunk is typeof chunk & { problemSolutionEffect: NonNullable<typeof chunk.problemSolutionEffect> } => 
            !!chunk.problemSolutionEffect
          )
          .map(chunk => ({
            triplet: {
              problem: chunk.problemSolutionEffect.problem,
              solution: chunk.problemSolutionEffect.solution,
              effect: chunk.problemSolutionEffect.effect,
              confidence: chunk.problemSolutionEffect.confidence,
              source: chunk.id || `chunk_${chunk.index}`,
              metadata: {
                domain: documentMetadata.domain,
              },
            } as any,
            chunkId: chunk.id || `chunk_${chunk.index}`,
            documentId: generatedDocumentId,
          }));
        
        if (tripletsToStore.length > 0) {
          const storedIds = await pseStorageService.batchStoreTriplets(tripletsToStore);
          tripletsStored = storedIds.length;
          console.log(`   ✅ Stored ${tripletsStored} P-S-E triplets in database`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to store P-S-E triplets:', error);
      }
    }
    
    // Step 5: Return enriched chunks with embeddings
    return NextResponse.json({
      success: true,
      documentId: generatedDocumentId,
      chunksProcessed: chunksWithEmbeddings.length,
      enriched: enableEnrichment,
      tripletsStored,
      filename: fileName,
      chunks: chunksWithEmbeddings.map(({ chunk, embedding }) => ({
        id: chunk.id,
        index: chunk.index,
        originalContent: chunk.originalContent,
        context: chunk.context,
        enrichedContent: chunk.enrichedContent,
        embedding: embedding,
        metadata: {
          ...chunk.metadata,
          problemSolutionEffect: chunk.problemSolutionEffect,
        },
      })),
      message: 'Document processed with contextual enrichment and P-S-E extraction',
    });

  } catch (error: any) {
    console.error('❌ Document processing error:', error);
    return NextResponse.json(
      { 
        error: 'Document processing failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Split document into chunks with overlap
 */
function chunkDocument(
  text: string, 
  chunkSize: number = 1000, 
  overlap: number = 200
): Array<{ content: string; index: number }> {
  const chunks: Array<{ content: string; index: number }> = [];
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

