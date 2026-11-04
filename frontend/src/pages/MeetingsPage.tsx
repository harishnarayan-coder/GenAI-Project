import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingsApi } from '../lib/api';
import { Meeting } from '../types';
import { Search, Loader2, FileText, Calendar, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await meetingsApi.list({ limit: 50 });
      setMeetings(res.data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteMeeting = async (id: number) => {
    if (!confirm('Delete this meeting and all its data?')) return;
    try {
      await meetingsApi.delete(id);
      setMeetings(ms => ms.filter(m => m.id !== id));
      toast.success('Meeting deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const reanalyze = async (id: number) => {
    try {
      toast.loading('Reanalyzing...', { id: 'reanalyze' });
      await meetingsApi.reanalyze(id);
      toast.success('Meeting reanalyzed!', { id: 'reanalyze' });
      load();
    } catch { toast.error('Reanalysis failed', { id: 'reanalyze' }); }
  };

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.date?.includes(search)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/app/new-meeting" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          + New Meeting
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, project, or date..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-sm transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <Link to={`/app/meetings/${m.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 truncate">{m.title}</Link>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${m.status === 'analyzed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {m.status === 'analyzed' ? 'Analyzed' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {m.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.date}</span>}
                    {m.project_name && <span>• {m.project_name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link to={`/app/meetings/${m.id}`} className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition" title="Open">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button onClick={() => reanalyze(m.id)} className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition" title="Reanalyze">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMeeting(m.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No meetings found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{search ? 'Try a different search term.' : 'Create your first meeting to get started.'}</p>
        </div>
      )}
    </div>
  );
}
