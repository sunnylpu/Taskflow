/**
 * AdminPage.jsx — Admin Panel (ADMIN role only)
 *
 * Displays all users and all tasks, with role management and user deletion.
 * Access is double-guarded: ProtectedRoute (frontend) + RBAC middleware (backend).
 */

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import apiClient from '../api/axiosClient';

export default function AdminPage() {
  const [tab, setTab]     = useState('users'); // 'users' | 'tasks'
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [tasksPagination, setTasksPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [usersPage, setUsersPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/v1/admin/users?page=${usersPage}&limit=20`);
      setUsers(data.data.users);
      setUsersPagination(data.data.pagination);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [usersPage]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/v1/admin/tasks?page=${tasksPage}&limit=20`);
      setTasks(data.data.tasks);
      setTasksPagination(data.data.pagination);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [tasksPage]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function handleDeleteUser(userId) {
    if (!window.confirm('Delete this user and all their tasks? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/api/v1/admin/users/${userId}`);
      showToast('success', 'User deleted.');
      fetchUsers();
      fetchTasks();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await apiClient.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      showToast('success', `Role updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>🛡️ Admin Panel</h1>
          <p>Manage users and view all tasks across the platform.</p>
        </div>

        {toast && (
          <div className={`alert alert-${toast.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
            {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
          </div>
        )}

        {/* Stats Banner */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff' }}>👥</div>
            <div>
              <div className="stat-value" style={{ color: '#6c63ff' }}>{usersPagination.total}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>📋</div>
            <div>
              <div className="stat-value" style={{ color: '#10b981' }}>{tasksPagination.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-sm" style={{ marginBottom: 20 }}>
          <button
            id="tab-users"
            className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab('users')}
          >
            👥 Users ({usersPagination.total})
          </button>
          <button
            id="tab-tasks"
            className={`btn ${tab === 'tasks' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab('tasks')}
          >
            📋 All Tasks ({tasksPagination.total})
          </button>
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          loading ? <LoadingSkeleton /> : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Email', 'Role', 'Tasks', 'Joined', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.9rem' }}>{u.email}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {u._count?.tasks ?? 0}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div className="flex gap-sm">
                            <select
                              id={`role-select-${u.id}`}
                              className="form-select"
                              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              id={`btn-delete-user-${u.id}`}
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar page={usersPage} pages={usersPagination.pages} setPage={setUsersPage} prefix="users" />
            </>
          )
        )}

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          loading ? <LoadingSkeleton /> : (
            <>
              <div className="task-list">
                {tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-body">
                      <div className="task-title">{task.title}</div>
                      {task.description && <div className="task-desc">{task.description}</div>}
                      <div className="task-meta">
                        <span className={`badge badge-${task.status === 'DONE' ? 'done' : task.status === 'IN_PROGRESS' ? 'progress' : 'todo'}`}>
                          {task.status}
                        </span>
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                        <span className="task-date">Owner: {task.owner?.email}</span>
                        <span className="task-date">{new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationBar page={tasksPage} pages={tasksPagination.pages} setPage={setTasksPage} prefix="tasks" />
            </>
          )
        )}
      </main>
    </div>
  );
}

function PaginationBar({ page, pages, setPage, prefix }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button id={`btn-${prefix}-prev`} className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
      <span className="text-muted text-sm">Page {page} of {pages}</span>
      <button id={`btn-${prefix}-next`} className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
    </div>
  );
}
