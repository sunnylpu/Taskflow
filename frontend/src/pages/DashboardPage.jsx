/**
 * DashboardPage.jsx — Overview / Home screen after login
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import apiClient from '../api/axiosClient';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const { data } = await apiClient.get('/api/v1/tasks?limit=5');
        if (cancelled) return;
        const tasks = data.data.tasks;
        const total = data.data.pagination.total;
        setRecentTasks(tasks);
        setStats({
          total,
          todo:       tasks.filter((t) => t.status === 'TODO').length,
          inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
          done:       tasks.filter((t) => t.status === 'DONE').length,
        });
      } catch {
        // Silently fail — data not critical for dashboard
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <h1>{greeting}, {user?.email?.split('@')[0]} 👋</h1>
          <p>Here&apos;s what&apos;s happening with your tasks today.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📋" label="Total Tasks"  value={stats.total}      color="#6c63ff" bg="rgba(108,99,255,0.1)" />
          <StatCard icon="⏳" label="Todo"         value={stats.todo}       color="#8888a8" bg="rgba(136,136,168,0.1)" />
          <StatCard icon="🔄" label="In Progress"  value={stats.inProgress} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
          <StatCard icon="✅" label="Completed"    value={stats.done}       color="#10b981" bg="rgba(16,185,129,0.1)" />
        </div>

        {/* Recent Tasks */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Recent Tasks</h2>
            <button id="btn-view-all" className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 60 }} />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📋</div>
              <p>No tasks yet. Create your first task!</p>
              <button id="btn-create-first" className="btn btn-primary btn-sm" onClick={() => navigate('/tasks')}>
                ➕ Create Task
              </button>
            </div>
          ) : (
            <div className="task-list">
              {recentTasks.map((task) => (
                <MiniTaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Quick Actions</h2>
          <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
            <button id="btn-quick-new-task" className="btn btn-primary" onClick={() => navigate('/tasks')}>
              ➕ New Task
            </button>
            <button id="btn-quick-in-progress" className="btn btn-secondary" onClick={() => navigate('/tasks?status=IN_PROGRESS')}>
              🔄 View In Progress
            </button>
            {user?.role === 'ADMIN' && (
              <button id="btn-quick-admin" className="btn btn-secondary" onClick={() => navigate('/admin')}>
                🛡️ Admin Panel
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const STATUS_MAP = {
  TODO:        { label: 'Todo',        cls: 'badge-todo' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-progress' },
  DONE:        { label: 'Done',        cls: 'badge-done' },
};

const PRIORITY_MAP = {
  LOW:    { label: 'Low',    cls: 'badge-low' },
  MEDIUM: { label: 'Medium', cls: 'badge-medium' },
  HIGH:   { label: 'High',   cls: 'badge-high' },
};

function MiniTaskItem({ task }) {
  const s = STATUS_MAP[task.status] ?? {};
  const p = PRIORITY_MAP[task.priority] ?? {};
  return (
    <div className="task-item">
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className={`badge ${s.cls}`}>{s.label}</span>
          <span className={`badge ${p.cls}`}>{p.label}</span>
          <span className="task-date">{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
