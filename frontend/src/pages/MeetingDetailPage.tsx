import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsApi, tasksApi } from '../lib/api';
import { Meeting, ActionItem } from '../types';
import { ArrowLeft, Loader2, Copy, CheckCircle, Calendar, User, AlertCircle, MessageSquare, Edit2, Trash2, ChevronDown, ChevronUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = ['Summary', 'Decisions', 'Action Items', 'Dates & Follow-ups'] as const;

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Summary');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [expandedCtx, setExpandedCtx] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await meetingsApi.get(Number(id));
        setMeeting(res.data);
      } catch {
        toast.error('Meeting not found');
        navigate('/app/meetings');
      }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const updateTask = async (taskId: number, data: Partial<ActionItem>) => {
    try {
      await tasksApi.update(taskId, data);
      const res = await meetingsApi.get(Number(id));
      setMeeting(res.data);
      toast.success('Task updated');
      setEditingTask(null);
    } catch {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      const res = await meetingsApi.get(Number(id));
      setMeeting(res.data);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!meeting) return null;

  const filteredItems = (meeting.action_items || []).filter(i => priorityFilter === 'All' || i.priority === priorityFilter);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate('/app/meetings')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Meetings
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
            {meeting.date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{meeting.date}</span>}
            {meeting.project_name && <span>• {meeting.project_name}</span>}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meeting.status === 'analyzed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
              {meeting.status === 'analyzed' ? 'Analyzed' : 'Pending'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => meeting.summary && copyText(meeting.summary.executive_summary || '')} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <Copy className="w-3.5 h-3.5" /> Copy Summary
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'Summary' && (
        <div className="space-y-6">
          {meeting.summary && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Executive Summary</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{meeting.summary.executive_summary}</p>
            </div>
          )}
          {meeting.summary?.discussion_points && meeting.summary.discussion_points.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Discussion Points</h3>
              <ul className="space-y-2">
                {meeting.summary.discussion_points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meeting.summary?.topics && meeting.summary.topics.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.summary.topics.map((t, i) => (
                  <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{p.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decisions Tab */}
      {activeTab === 'Decisions' && (
        <div className="space-y-4">
          {(meeting.decisions || []).length > 0 ? meeting.decisions!.map((d, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{d.content}</p>
                  {d.context && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">"{d.context}"</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  d.decision_type === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  d.decision_type === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>{d.decision_type}</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-16 text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No decisions extracted from this meeting.</p></div>
          )}
        </div>
      )}

      {/* Action Items Tab */}
      {activeTab === 'Action Items' && (
        <div>
          <div className="flex gap-2 mb-5 overflow-x-auto">
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${priorityFilter === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {filteredItems.length > 0 ? filteredItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        item.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>{item.priority}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{item.status}</span>
                    </div>
                    {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">{item.description}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setEditingTask(item)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTask(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.assigned_to}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.deadline || 'No deadline'}</span>
                  {item.confidence_score != null && (
                    <span className="flex items-center gap-1.5">
                      Confidence:
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                        <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${item.confidence_score * 100}%` }} />
                      </div>
                      {Math.round(item.confidence_score * 100)}%
                    </span>
                  )}
                </div>
                {item.source_context && (
                  <div className="mt-3">
                    <button onClick={() => setExpandedCtx(expandedCtx === item.id ? null : item.id)} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                      Source context {expandedCtx === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {expandedCtx === item.id && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 italic">"{item.source_context}"</div>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-16 text-gray-400"><CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No action items found{priorityFilter !== 'All' ? ` with ${priorityFilter} priority` : ''}.</p></div>
            )}
          </div>
        </div>
      )}

      {/* Dates & Follow-ups Tab */}
      {activeTab === 'Dates & Follow-ups' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Important Dates</h3>
            {(meeting.important_dates || []).length > 0 ? (
              <div className="space-y-3">
                {meeting.important_dates!.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{d.date_text}</p>
                      {d.context && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.context}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No specific dates mentioned in this meeting.</p>}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Follow-up Questions</h3>
            {(meeting.follow_ups || []).length > 0 ? (
              <div className="space-y-3">
                {meeting.follow_ups!.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{f.question}</p>
                      {f.context && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.context}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No follow-up items identified.</p>}
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Edit Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Pending</option><option>In Progress</option><option>Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                <input type="text" value={editingTask.assigned_to} onChange={e => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                <input type="date" value={editingTask.deadline || ''} onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingTask(null)} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={() => updateTask(editingTask.id, { status: editingTask.status, priority: editingTask.priority, assigned_to: editingTask.assigned_to, deadline: editingTask.deadline })}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
