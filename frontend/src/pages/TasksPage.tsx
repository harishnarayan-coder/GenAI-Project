import { useState, useEffect } from 'react';
import { tasksApi } from '../lib/api';
import { ActionItem } from '../types';
import { Search, Loader2, CheckSquare, Plus, Edit2, Trash2, GripVertical, LayoutList, Columns, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: 'Unassigned', priority: 'Medium', deadline: '', meeting_id: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterPriority) params.priority = filterPriority;
      if (filterStatus) params.status = filterStatus;
      const res = await tasksApi.list(params);
      setTasks(res.data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterPriority, filterStatus]);

  const updateTask = async (id: number, data: any) => {
    try {
      await tasksApi.update(id, data);
      load();
      toast.success('Task updated');
      setEditingTask(null);
    } catch { toast.error('Update failed'); }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksApi.delete(id); load(); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const changeStatus = async (id: number, status: string) => {
    await updateTask(id, { status });
  };

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.assigned_to?.toLowerCase().includes(search.toLowerCase())
  );

  const kanbanCols = [
    { title: 'To Do', status: 'Pending', color: 'border-gray-300 dark:border-gray-600' },
    { title: 'In Progress', status: 'In Progress', color: 'border-blue-400 dark:border-blue-500' },
    { title: 'Completed', status: 'Completed', color: 'border-green-400 dark:border-green-500' },
  ];

  const priorityBadge = (p: string) => {
    const cls = p === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : p === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{p}</span>;
  };

  const statusBadge = (s: string) => {
    const cls = s === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : s === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{s}</span>;
  };

  const isOverdue = (t: ActionItem) => t.deadline && t.status !== 'Completed' && t.deadline < new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              <Columns className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Priorities</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : view === 'list' ? (
        /* LIST VIEW */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Assigned To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Deadline</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isOverdue(t) ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                        {isOverdue(t) && <span className="text-red-500 text-xs mr-1">⚠</span>}{t.title}
                      </td>
                      <td className="py-3 px-4">{priorityBadge(t.priority)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{t.assigned_to}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{t.deadline || '—'}</td>
                      <td className="py-3 px-4">
                        <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)}
                          className="bg-transparent border-0 text-sm font-medium focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 cursor-pointer">
                          <option>Pending</option><option>In Progress</option><option>Completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditingTask(t)} className="p-1.5 text-gray-400 hover:text-indigo-500"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteTask(t.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No tasks found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tasks will appear here after analyzing meetings.</p>
            </div>
          )}
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanCols.map(col => {
            const items = filtered.filter(t => t.status === col.status);
            return (
              <div key={col.status} className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border-t-4 ${col.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{col.title}</h3>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {items.map(t => (
                    <div key={t.id} className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${isOverdue(t) ? 'border-red-200 dark:border-red-800' : ''}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t.title}</h4>
                        {priorityBadge(t.priority)}
                      </div>
                      <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1"><User className="w-3 h-3" />{t.assigned_to}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.deadline || 'No deadline'}</div>
                        {isOverdue(t) && <div className="text-red-500 font-medium">⚠ Overdue</div>}
                      </div>
                      <div className="flex gap-1 mt-3 pt-2 border-t border-gray-50 dark:border-gray-700">
                        {col.status !== 'Pending' && (
                          <button onClick={() => changeStatus(t.id, col.status === 'Completed' ? 'In Progress' : 'Pending')} className="text-xs text-gray-400 hover:text-indigo-500">← Move back</button>
                        )}
                        {col.status !== 'Completed' && (
                          <button onClick={() => changeStatus(t.id, col.status === 'Pending' ? 'In Progress' : 'Completed')} className="text-xs text-gray-400 hover:text-indigo-500 ml-auto">Move →</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Edit Task</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>High</option><option>Medium</option><option>Low</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Pending</option><option>In Progress</option><option>Completed</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                <input value={editingTask.assigned_to} onChange={e => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                <input type="date" value={editingTask.deadline || ''} onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingTask(null)} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm">Cancel</button>
              <button onClick={() => updateTask(editingTask.id, { title: editingTask.title, description: editingTask.description, status: editingTask.status, priority: editingTask.priority, assigned_to: editingTask.assigned_to, deadline: editingTask.deadline })}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
