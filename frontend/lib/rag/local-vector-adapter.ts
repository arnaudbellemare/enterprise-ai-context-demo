import { VectorStoreAdapter, Document, SearchOptions, CollectionInfo } from './vector-store-adapter';

export class LocalVectorAdapter implements VectorStoreAdapter {
  private documents: Document[] = [];
  private name: string;

  constructor(name: string = 'local') {
    this.name = name;
  }

  async similaritySearch(query: string, k: number, options?: SearchOptions): Promise<Document[]> {
    // Keyword-only similarity: Jaccard with token overlap
    const scored = this.documents.map((doc, idx) => ({
      doc,
      score: this.jaccard(this.tokenize(query), this.tokenize(doc.content))
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((s, i) => ({ ...s.doc, similarity: s.score, rank: i + 1 }));
  }

  async vectorSearch(queryVector: number[], k: number, options?: SearchOptions): Promise<Document[]> {
    // Not supported in local adapter; fallback to similaritySearch with empty query
    return this.similaritySearch('', k, options);
  }

  async hybridSearch(query: string, k: number, alpha: number, options?: SearchOptions): Promise<Document[]> {
    // Same as similaritySearch for local adapter
    return this.similaritySearch(query, k, options);
  }

  async getCollectionInfo(): Promise<CollectionInfo> {
    return {
      name: this.name,
      count: this.documents.length,
      dimension: 0,
    };
  }

  async insert(documents: Document[]): Promise<void> {
    this.documents.push(
      ...documents.map(d => ({
        id: d.id || Math.random().toString(36).slice(2),
        content: d.content,
        metadata: d.metadata,
      }))
    );
  }

  async delete(ids: string[]): Promise<void> {
    const set = new Set(ids);
    this.documents = this.documents.filter(d => !set.has(d.id));
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      (text || '')
        .toLowerCase()
        .replace(/[\W_]+/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
  }

  private jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    const inter = new Set([...a].filter(x => b.has(x))).size;
    const uni = new Set([...a, ...b]).size;
    return inter / uni;
  }
}
