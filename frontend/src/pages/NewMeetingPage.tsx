import { useState, FormEvent, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Upload, FileText, X, Loader2, Type, File } from 'lucide-react';
import { meetingsApi, aiApi } from '../lib/api';
import toast from 'react-hot-toast';

export default function NewMeetingPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [project, setProject] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Meeting title is required'); return; }
    if (tab === 'paste' && !notes.trim()) { toast.error('Please enter meeting notes'); return; }
    if (tab === 'upload' && !file) { toast.error('Please upload a file'); return; }

    setLoading(true);
    setProgress(10);

    try {
      // Step 1: Create meeting
      setProgress(20);
      const partList = participants.split(',').map(p => p.trim()).filter(Boolean);
      const meetingRes = await meetingsApi.create({
        title: title.trim(),
        date,
        project_name: project.trim() || undefined,
        participants: partList.length > 0 ? partList : undefined,
        raw_content: tab === 'paste' ? notes : undefined,
      });
      const meetingId = meetingRes.data.id;
      setProgress(40);

      // Step 2: Analyze with AI
      if (tab === 'paste') {
        setProgress(60);
        await aiApi.analyze({
          meeting_id: meetingId,
          notes: notes.trim(),
        } as any);
      } else if (file) {
        setProgress(60);
        // Read file and send as text
        const text = await file.text();
        await aiApi.analyze({
          meeting_id: meetingId,
          notes: text,
        } as any);
      }

      setProgress(100);
      toast.success('Meeting analyzed successfully!');
      navigate(`/app/meetings/${meetingId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Meeting Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Enter meeting details and notes for AI analysis.</p>
      </div>

      {loading && (
        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">AI is analyzing your meeting notes...</p>
          <div className="w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full h-2 mb-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-indigo-500">This may take a few seconds</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Meeting Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Meeting Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q4 Strategy Review"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Meeting Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project / Department</label>
              <input type="text" value={project} onChange={e => setProject(e.target.value)} placeholder="e.g. Engineering"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Participants</label>
              <input type="text" value={participants} onChange={e => setParticipants(e.target.value)} placeholder="Alice, Bob, Charlie"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              <p className="text-xs text-gray-400 mt-1">Comma-separated names</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Meeting Content</h2>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setTab('paste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'paste' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              <Type className="w-4 h-4" /> Paste Notes
            </button>
            <button type="button" onClick={() => setTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              <Upload className="w-4 h-4" /> Upload File
            </button>
          </div>

          {tab === 'paste' ? (
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={12}
              placeholder={"Paste your meeting notes, transcript, or minutes here...\n\nExample:\n\nAttendees: Sarah, Mike, John\nDate: November 4, 2024\n\n1. Product roadmap was reviewed. Sarah will finalize the roadmap by Nov 15.\n2. Marketing budget approved at $50K for Q4.\n3. Hiring plan: Need 3 new engineers by January.\n   - John to post job listings by next week.\n4. Next meeting scheduled for November 18.\n\nAction items discussed:\n- Sarah to update product specs (High priority, due Nov 10)\n- Mike to prepare campaign draft\n- John to schedule interviews"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y min-h-[300px] text-sm leading-relaxed" />
          ) : (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            >
              <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.md" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-indigo-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
                  <p className="font-medium text-gray-600 dark:text-gray-300">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Supports TXT, PDF, DOCX, MD (max 10 MB)</p>
                </>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 text-lg">
          <Sparkles className="w-5 h-5" />
          {loading ? 'Analyzing...' : 'Generate Meeting Insights'}
        </button>
      </form>
    </div>
  );
}
