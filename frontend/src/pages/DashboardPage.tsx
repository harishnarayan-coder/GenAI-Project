import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsApi, meetingsApi } from '../lib/api';
import { AnalyticsOverview, Meeting } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, FileText, CheckSquare, Clock, AlertTriangle, TrendingUp, Loader2, Calendar } from 'lucide-react';

const PIE_COLORS = ['#6366F1', '#F59E0B', '#16A34A'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          analyticsApi.overview(),
          meetingsApi.list({ limit: 5 }),
        ]);
        setStats(sRes.data);
        setMeetings(mRes.data);
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const statusData = stats ? [
    { name: 'Pending', value: stats.pending_tasks },
    { name: 'In Progress', value: stats.in_progress_tasks },
    { name: 'Completed', value: stats.completed_tasks },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {user?.full_name?.split(' ')[0] || user?.username || 'there'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's your meeting intelligence overview.</p>
        </div>
        <Link to="/app/new-meeting"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          <PlusCircle className="w-4 h-4" /> New Meeting Analysis
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: stats?.total_meetings ?? 0, icon: <FileText className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
          { label: 'Action Items', value: stats?.total_action_items ?? 0, icon: <CheckSquare className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400' },
          { label: 'Pending Tasks', value: stats?.pending_tasks ?? 0, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Completed', value: stats?.completed_tasks ?? 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
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

      {/* Second row stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Tasks</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.overdue_tasks ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.in_progress_tasks ?? 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Task Status Distribution</h3>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 text-sm">
              No task data yet. Analyze a meeting to get started.
            </div>
          )}
        </div>

        {/* Recent Meetings Bar - shows count of action items per meeting */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Meetings</h3>
          {meetings.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={meetings.map(m => ({ name: m.title?.substring(0, 12) || 'Meeting', date: m.date || '' }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="date" fill="#6366F1" radius={[4, 4, 0, 0]} name="Date" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 text-sm">
              No meetings yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Meetings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Meetings</h3>
          <Link to="/app/meetings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All →</Link>
        </div>
        {meetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Title</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{m.title}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{m.date || '—'}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === 'analyzed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {m.status === 'analyzed' ? 'Analyzed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link to={`/app/meetings/${m.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium text-xs">Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No meetings yet</p>
            <p className="text-sm mt-1">Create your first meeting analysis to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
