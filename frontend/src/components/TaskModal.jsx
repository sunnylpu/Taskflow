/**
 * TaskModal.jsx — Create / Edit Task Modal
 *
 * Security: All user input rendered via React JSX (auto-escaped).
 * No dangerouslySetInnerHTML used anywhere.
 */

import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'TODO',        label: '⏳ Todo' },
  { value: 'IN_PROGRESS', label: '🔄 In Progress' },
  { value: 'DONE',        label: '✅ Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: '🟢 Low' },
  { value: 'MEDIUM', label: '🟡 Medium' },
  { value: 'HIGH',   label: '🔴 High' },
];

export default function TaskModal({ task, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    status:      task?.status      ?? 'TODO',
    priority:    task?.priority    ?? 'MEDIUM',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function validate() {
    const e = {};
    if (!form.title.trim())           e.title = 'Title is required.';
    if (form.title.length > 200)      e.title = 'Title must not exceed 200 characters.';
    if (form.description.length > 2000) e.description = 'Description must not exceed 2000 characters.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      status:      form.status,
      priority:    form.priority,
    };

    const result = await onSave(payload);
    setSaving(false);

    if (result?.errors) {
      // Map server validation errors back to fields
      const serverErrs = {};
      result.errors.forEach(({ field, message }) => { serverErrs[field] = message; });
      setErrors(serverErrs);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">{isEdit ? '✏️ Edit Task' : '➕ New Task'}</h3>
          <button id="btn-modal-close" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                className={`form-input ${errors.title ? 'error' : ''}`}
                type="text"
                placeholder="Enter task title..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={200}
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Optional description..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={2000}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            {/* Status & Priority row */}
            <div className="flex gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button id="btn-task-cancel" type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              id="btn-task-save"
              type="submit"
              className={`btn btn-primary ${saving ? 'btn-loading' : ''}`}
              disabled={saving}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
