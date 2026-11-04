import { useState, useEffect } from 'react';
import { analyticsApi, tasksApi } from '../lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, Download, BarChart2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#16A34A', Pending: '#94A3B8', 'In Progress': '#6366F1', Completed: '#16A34A' };

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [o, t] = await Promise.all([analyticsApi.overview(), analyticsApi.tasks()]);
        setOverview(o.data);
        setTaskData(t.data);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, []);

  const exportCSV = async () => {
    try {
      const res = await tasksApi.list({});
      const tasks = res.data;
      const csv = ['Title,Assigned To,Priority,Deadline,Status'];
      tasks.forEach((t: any) => csv.push(`"${t.title}","${t.assigned_to}","${t.priority}","${t.deadline || ''}","${t.status}"`));
      const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'meetmind_tasks.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Tasks exported as CSV');
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  const priorityData = taskData ? [
    { name: 'High', value: taskData.priority_distribution.high, fill: COLORS.High },
    { name: 'Medium', value: taskData.priority_distribution.medium, fill: COLORS.Medium },
    { name: 'Low', value: taskData.priority_distribution.low, fill: COLORS.Low },
  ].filter(d => d.value > 0) : [];

  const statusData = taskData ? [
    { name: 'Pending', value: taskData.status_distribution.pending, fill: COLORS.Pending },
    { name: 'In Progress', value: taskData.status_distribution.in_progress, fill: COLORS['In Progress'] },
    { name: 'Completed', value: taskData.status_distribution.completed, fill: COLORS.Completed },
  ].filter(d => d.value > 0) : [];

  const meetingsTimeline = taskData?.meetings_over_time || [];
  const completionRate = overview?.completion_rate ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Insights into your meeting productivity.</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
          <Download className="w-4 h-4" /> Export Tasks CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Meetings', value: overview?.total_meetings ?? 0, icon: <BarChart2 className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
          { label: 'Action Items', value: overview?.total_action_items ?? 0, icon: <CheckCircle className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400' },
          { label: 'Pending', value: overview?.pending_tasks ?? 0, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Overdue', value: overview?.overdue_tasks ?? 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Task Completion Rate</h3>
          <span className="text-2xl font-bold text-indigo-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
          <div className="bg-indigo-600 h-3 rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Priority Distribution Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Priority Distribution</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Status Distribution Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Meetings Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Meetings Over Time</h3>
        {meetingsTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={meetingsTimeline}>
              <defs>
                <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorMeetings)" name="Meetings" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No data yet. Analyze meetings to see trends.</div>
        )}
      </div>
    </div>
  );
}
