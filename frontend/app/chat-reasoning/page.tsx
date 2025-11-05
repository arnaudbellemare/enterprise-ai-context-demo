'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ReasoningStep {
  step: string;
  title: string;
  content: string;
  status: 'in_progress' | 'complete';
  data?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: ReasoningStep[];
  metadata?: any;
  attachedDocument?: {
    id: string;
    name: string;
    type: string;
    size: number;
    processed: boolean;
  };
}

interface AttachedDocument {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  processed: boolean;
  content?: string;
  chunks?: number;
}

export default function ChatReasoningPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState<ReasoningStep[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [mode, setMode] = useState<'expert' | 'lite' | 'lite-gamp' | 'lite-officer'>('expert'); // 'expert' = unified pipeline, 'lite' = permutation-lite, 'lite-gamp' = permutation-lite with GAMP, 'lite-officer' = GEPA unified framework
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentReasoning]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessingDocument(true);
    
    for (const file of files) {
      // Verify document
      const verification = verifyDocument(file);
      if (!verification.valid) {
        alert(`Document verification failed: ${verification.error}`);
        continue;
      }

      try {
        // Upload and process document with contextual enrichment
        const formData = new FormData();
        formData.append('file', file);
        formData.append('enableEnrichment', 'true');

        const uploadResponse = await fetch('/api/documents/ingest-with-context', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Document upload failed');
        }

        const uploadData = await uploadResponse.json();
        const fileContent = await file.text();

        // Store document in session
        const doc: AttachedDocument = {
          id: uploadData.documentId || `doc_${Date.now()}`,
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          processed: true,
          content: fileContent,
          chunks: uploadData.chunksProcessed || 0,
        };

        setAttachedDocuments(prev => [...prev, doc]);
        
        // Add message showing document was added
        setMessages(prev => [...prev, {
          role: 'user',
          content: `📄 Document attached: ${file.name}`,
          attachedDocument: {
            id: doc.id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            processed: doc.processed,
          }
        }]);
      } catch (error) {
        console.error('Document processing error:', error);
        alert(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsProcessingDocument(false);
  };

  const verifyDocument = (file: File): { valid: boolean; error?: string } => {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'text/csv',
      'application/json',
      'text/html',
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|pdf|csv|json|html)$/i)) {
      return { valid: false, error: 'Unsupported file type. Supported: txt, md, pdf, csv, json, html' };
    }

    return { valid: true };
  };

  const removeDocument = (docId: string) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Build query with attached documents context
    let queryWithContext = input;
    const documentContexts: string[] = [];

    if (attachedDocuments.length > 0) {
      documentContexts.push(`\n\n[Attached Documents (${attachedDocuments.length}):]`);
      attachedDocuments.forEach((doc, idx) => {
        // Include document name and summary
        const preview = doc.content 
          ? doc.content.substring(0, 200) + '...' 
          : 'Document processed and ready';
        documentContexts.push(`\n${idx + 1}. ${doc.name} (${doc.chunks || 0} chunks) - ${preview}`);
      });
      queryWithContext = input + documentContexts.join('\n');
    }

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      attachedDocument: attachedDocuments.length > 0 ? {
        id: attachedDocuments[0].id,
        name: attachedDocuments[0].name,
        type: attachedDocuments[0].type,
        size: attachedDocuments[0].size,
        processed: attachedDocuments[0].processed,
      } : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentReasoning([]);

    try {
      const response = await fetch('/api/chat-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: queryWithContext, // Include document context
          domain: 'general',
          mode: mode, // Pass mode to API
          stream: true, // Enable streaming
          attachedDocuments: attachedDocuments.map(doc => ({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            chunks: doc.chunks,
          }))
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response is streaming (text/event-stream) or JSON
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response (SSE)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedAnswer = '';
        const reasoningSteps: ReasoningStep[] = [];
        
        if (!reader) {
          throw new Error('Stream reader not available');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            
            const [eventLine, dataLine] = line.split('\ndata: ');
            const eventMatch = eventLine.match(/event: (\w+)/);
            const event = eventMatch ? eventMatch[1] : 'message';
            
            if (dataLine) {
              try {
                const data = JSON.parse(dataLine);
                
                if (event === 'reasoning') {
                  // Update or add reasoning step
                  const existingIndex = reasoningSteps.findIndex(s => s.step === data.step);
                  const step: ReasoningStep = {
                    step: data.step,
                    title: data.title,
                    content: data.content,
                    status: data.status,
                    data: data.data
                  };
                  
                  if (existingIndex >= 0) {
                    reasoningSteps[existingIndex] = step;
                  } else {
                    reasoningSteps.push(step);
                  }
                  
                  // Update current reasoning in real-time
                  setCurrentReasoning([...reasoningSteps]);
                } else if (event === 'answer') {
                  // Final answer received
                  accumulatedAnswer = data.text || '';
                  const metadata = data.metadata || {};
                  
                  // Add complete message
                  const assistantMessage: Message = {
                    role: 'assistant',
                    content: accumulatedAnswer,
                    reasoning: reasoningSteps,
                    metadata: {
                      mode: metadata.mode || mode,
                      domain: metadata.domain,
                      quality_score: metadata.quality_score,
                      cost: metadata.cost,
                      duration: `${metadata.processing_time_ms || 0}ms`,
                      ...metadata
                    }
                  };
                  
                  setMessages(prev => [...prev, assistantMessage]);
                  setCurrentReasoning([]);
                } else if (event === 'error') {
                  throw new Error(data.error || 'Streaming error occurred');
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError, dataLine);
              }
            }
          }
        }
      } else {
        // Handle non-streaming JSON response (fallback)
        const data = await response.json();
        
        if (!data.success) {
          console.error('API returned error:', data);
          throw new Error(data.error || data.details || 'API request failed');
        }

        // Use real reasoning steps from pipeline (or fallback to metadata)
        const reasoningSteps: ReasoningStep[] = data.reasoningSteps || data.processingSteps?.map((step: string, idx: number) => ({
          step: String(idx + 1),
          title: step.split(':')[0] || `Step ${idx + 1}`,
          content: step.split(':').slice(1).join(':') || step,
          status: 'complete' as const
        })) || [];

        // Add assistant message with reasoning
        // Handle both expert (data.response) and lite (data.answer) response formats
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response || data.answer || 'No response generated',
          reasoning: reasoningSteps,
          metadata: {
            ...data.metadata,
            ...data.metrics,
            mode: data.metadata?.mode || mode,
            domain: data.domain || data.metadata?.domain,
            quality_score: data.confidence || data.metadata?.quality_score || data.metrics?.quality_score,
            components_used: data.systemComponents?.length || data.metrics?.components_used?.length || 0,
            cost: data.metadata?.cost || data.metrics?.cost || 0,
            duration: `${data.metadata?.processing_time_ms || data.metrics?.processing_time || 0}ms`,
            parallel_execution: data.metrics?.parallel_execution || false,
            streaming_enabled: data.metrics?.streaming_enabled || false
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentReasoning([]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, there was an error processing your request: ${errorMessage}. Please try again or rephrase your question.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Live Time Display */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-xs font-mono text-cyan-400">LIVE</span>
          <span className="text-xs font-mono text-cyan-400">{currentTime}</span>
        </div>
      </div>
      
      <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-1">
          <div className="inline-block px-6 py-2 bg-black text-white mb-2">
            <span className="text-xs font-bold tracking-widest">REAL-TIME REASONING</span>
          </div>
          <h1
            className="text-4xl font-bold text-black mb-2 tracking-tight text-center"
            style={{ fontFamily: 'Armitage, var(--font-quicksand), Quicksand, sans-serif' }}
          >
            <pre className="text-xs sm:text-sm mb-2" style={{ 
              background: 'linear-gradient(180deg, #22d3ee 0%, #000000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
{`
 ██████╗ ███████╗██████╗ ███╗   ███╗██╗   ██╗████████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
 ██╔══██╗██╔════╝██╔══██╗████╗ ████║██║   ██║╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
 ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   ███████║   ██║   ██║██║   ██║██╔██╗ ██║
 ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
 ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
 ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
`}
            </pre>
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Watch the AI reasoning unfold step-by-step in real-time
          </p>
        </div>

        {/* Chat Container */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="bg-white border-2 border-gray-900 shadow-xl">
            {/* Header */}
            <div className="bg-black text-white p-4 border-b-2 border-white">
              <div className="flex justify-between items-center">
                <h2 
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif' }}
                >
                  CONVERSATION WITH REASONING
                </h2>
                
                {/* Mode Selector */}
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-300 mr-2">Mode:</span>
                  <button
                    onClick={() => setMode('expert')}
                    className={`px-3 py-1 text-xs font-bold transition-all ${
                      mode === 'expert'
                        ? 'bg-cyan-400 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Expert Mode: Full Unified Permutation Pipeline (11+ components)"
                  >
                    EXPERT
                  </button>
                  <button
                    onClick={() => setMode('lite')}
                    className={`px-3 py-1 text-xs font-bold transition-all ${
                      mode === 'lite'
                        ? 'bg-cyan-400 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Lite Mode: Permutation-Lite (4-layer streamlined pipeline)"
                  >
                    LITE
                  </button>
                  <button
                    onClick={() => setMode('lite-gamp')}
                    className={`px-3 py-1 text-xs font-bold transition-all ${
                      mode === 'lite-gamp'
                        ? 'bg-cyan-400 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Lite-GAMP Mode: Permutation-Lite with GAMP (5-layer with graph reasoning)"
                  >
                    LITE-GAMP
                  </button>
                  <button
                    onClick={() => setMode('lite-officer')}
                    className={`px-3 py-1 text-xs font-bold transition-all ${
                      mode === 'lite-officer'
                        ? 'bg-cyan-400 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Lite-Officer Mode: Unified GEPA Framework (Goals-Evidence-Performance-Actions)"
                  >
                    LITE-OFFICER
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] p-6 space-y-5" style={{ overflowY: messages.length > 0 ? 'auto' : 'hidden' }}>
              {messages.length === 0 && (
                <div className="flex items-start justify-center h-full pt-20">
                  <div className="text-center text-gray-400">
                    <p className="text-md mb-3">Start a conversation to see real-time reasoning</p>
                    <p className="text-sm">Try asking:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• What are the top trending discussions on Hacker News?</li>
                      <li>• Analyze the latest Bitcoin market trends</li>
                      <li>• Calculate the ROI of a $10k S&P 500 investment</li>
                      <li>• Explain quantum computing applications</li>
                    </ul>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx}>
                  {/* User Message */}
                  {msg.role === 'user' && (
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[70%] bg-gray-900 text-white px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">YOU</p>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {msg.role === 'assistant' && (
                    <div className="mb-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold mb-2">PERMUTATION</p>
                          
                          {/* Reasoning Steps (Collapsed) */}
                          {msg.reasoning && msg.reasoning.length > 0 && (
                            <details className="mb-4">
                              <summary className="cursor-pointer text-sm text-gray-600 hover:text-black mb-2">
                                🔍 View Reasoning Process ({msg.reasoning.length} steps)
                              </summary>
                              <div className="space-y-2 mt-2 pl-4 border-l-2 border-gray-300">
                                {msg.reasoning.map((step, stepIdx) => (
                                  <div key={stepIdx} className="text-sm">
                                    <div className="flex items-start gap-2">
                                      <span className={step.status === 'complete' ? 'text-green-600' : 'text-yellow-600'}>
                                        {step.status === 'complete' ? 'COMPLETE' : 'IN PROGRESS'}
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800">{step.title}</p>
                                        <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap">{step.content}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}

                          {/* Final Answer */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div 
                              className="text-gray-800 whitespace-pre-wrap prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: msg.content
                                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                                  .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>')
                              }}
                            />
                          </div>

                          {/* Metadata */}
                          {msg.metadata && (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded">Domain: {msg.metadata.domain}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Quality: {(msg.metadata.quality_score * 100).toFixed(1)}%</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Components: {msg.metadata.components_used}/11</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Cost: {msg.metadata.cost}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Duration: {msg.metadata.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Current Reasoning (Live) */}
              {isLoading && currentReasoning.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold mb-3">PERMUTATION (thinking...)</p>
                      <div className="space-y-3">
                        {currentReasoning.map((step, idx) => (
                          <div 
                            key={idx}
                            className={`border-l-4 pl-4 py-2 ${
                              step.status === 'complete' 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-yellow-500 bg-yellow-50 animate-pulse'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-bold">
                                {step.status === 'complete' ? 'COMPLETE' : 'IN PROGRESS'}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{step.title}</p>
                                <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{step.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSubmit} 
              className="border-t-2 border-gray-900 p-4 bg-gray-50"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            >
              {/* Attached Documents */}
              {attachedDocuments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 px-3 py-1 bg-cyan-100 border border-cyan-300 rounded text-sm"
                    >
                      <span className="text-cyan-800">📄 {doc.name}</span>
                      {doc.processed && (
                        <span className="text-xs text-cyan-600">✓ {doc.chunks || 0} chunks</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-cyan-600 hover:text-cyan-800 ml-1"
                        title="Remove document"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop Zone */}
              {isDragOver && (
                <div className="mb-3 p-4 border-2 border-dashed border-cyan-400 bg-cyan-50 rounded text-center">
                  <p className="text-sm text-cyan-800">Drop document here to attach</p>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Ask anything... (or drop a document)"
                    className="w-full px-4 py-3 border-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 focus:shadow-lg transition-all placeholder-gray-500"
                    style={{ fontFamily: 'VT323, "Courier New", monospace', fontSize: '14px', letterSpacing: '0.5px' }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || isProcessingDocument}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.pdf,.csv,.json,.html"
                    onChange={handleFileSelect}
                    multiple
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-gray-700 text-white border-2 border-gray-700 hover:bg-gray-600 transition-all font-bold disabled:opacity-50"
                  disabled={isLoading || isProcessingDocument}
                  title="Attach document"
                >
                  📎
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || isProcessingDocument}
                >
                  {isLoading ? 'THINKING...' : isProcessingDocument ? 'PROCESSING...' : 'SEND'}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500" style={{ fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                {mode === 'expert' 
                  ? 'Expert Mode: Full Unified Permutation Pipeline (11+ components)'
                  : mode === 'lite'
                  ? 'Lite Mode: Permutation-Lite (4-layer streamlined pipeline)'
                  : mode === 'lite-gamp'
                  ? 'Lite-GAMP Mode: Permutation-Lite with GAMP (5-layer with graph reasoning)'
                  : 'Lite-Officer Mode: Unified GEPA Framework (Goals-Evidence-Performance-Actions with self-optimization)'}
                {attachedDocuments.length > 0 && ` | ${attachedDocuments.length} document(s) attached`}
              </div>
            </form>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Powered by PERMUTATION - Full AI Research Stack with Real-Time Reasoning</p>
        </div>
      </div>
    </div>
  );
}

