import { useState, useEffect, useRef } from 'react';
import { knowledgeApi } from '../lib/api';
import { KnowledgeDocument } from '../types';
import { Upload, Search, Loader2, FileText, Database, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KnowledgeBasePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const load = async () => {
    try {
      const res = await knowledgeApi.list();
      setDocs(res.data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await knowledgeApi.upload(formData);
      toast.success(`${file.name} uploaded and indexed!`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document from the knowledge base?')) return;
    try {
      await knowledgeApi.delete(id);
      setDocs(ds => ds.filter(d => d.id !== id));
      toast.success('Document deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setHasSearched(true);
    setLastQuery(searchQuery);
    try {
      const res = await knowledgeApi.search(searchQuery);
      setSearchResults(res.data.results || []);
    } catch { toast.error('Search failed'); }
    setSearching(false);
  };

  const totalChunks = docs.reduce((s, d) => s + d.chunk_count, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Upload past meeting documents to enhance AI analysis with RAG context.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center"><FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{docs.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Documents</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center"><Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalChunks}</p><p className="text-xs text-gray-500 dark:text-gray-400">Indexed Chunks</p></div>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Upload Document</h2>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
        >
          <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.md" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
          {uploading ? (
            <div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Uploading and indexing...</span></div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
              <p className="font-medium text-gray-600 dark:text-gray-300 text-sm">Drop file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Supports TXT, PDF, DOCX, MD</p>
            </>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Indexed Documents</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{d.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{d.chunk_count} chunks • {d.file_type?.toUpperCase() || 'TXT'} • {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No documents uploaded yet.</p>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Search Knowledge Base</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search for topics, decisions, action items..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          <button onClick={handleSearch} disabled={searching}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm flex items-center gap-2">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
        </div>
        {hasSearched && !searching && searchResults.length === 0 && (
          <div className="mt-4 p-5 text-center rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-dashed border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No matching excerpts found for "{lastQuery}"</p>
            <p className="text-xs text-gray-400 mt-1">Try other keywords related to your uploaded documents.</p>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
              <button onClick={() => { setSearchResults([]); setHasSearched(false); }} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
            {searchResults.map((r, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{r.filename}</span>
                  <span className="text-xs text-gray-400">• Relevance: {(1 - (r.distance || 0)).toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
