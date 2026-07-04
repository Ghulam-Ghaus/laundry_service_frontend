'use client';

import React, { useEffect, useState } from 'react';
import { staffApi, StaffTask } from '@/lib/api/staff.api';

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note log state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskNote, setTaskNote] = useState('');

  // Load tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const data = await staffApi.getTasks();
        setTasks(data || []);
      } catch (err: any) {
        setError(err.message || 'Access Denied. Rider session not validated.');
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await staffApi.updateTaskStatus(taskId, newStatus);
      alert('Task status updated successfully!');
      // Reload list
      const data = await staffApi.getTasks();
      setTasks(data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId || !taskNote) return;
    try {
      await staffApi.addTaskNotes(activeTaskId, taskNote);
      alert('Rider intake notes logged!');
      setActiveTaskId(null);
      setTaskNote('');
      // Reload list
      const data = await staffApi.getTasks();
      setTasks(data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to add notes.');
    }
  };

  const taskStatuses = [
    { code: 'assigned', label: 'Assigned' },
    { code: 'in_transit', label: 'In Transit' },
    { code: 'completed', label: 'Completed' },
    { code: 'failed', label: 'Failed' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading rider logbook...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">🏍️</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restrained</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Rider authorization checks failed. Verify your staff credentials or contact support.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 flex flex-col gap-8">
      {/* Header */}
      <div>
        <span className="text-[#cca43b] text-[10px] font-bold tracking-widest uppercase block mb-1">
          Rider Companion
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1d20] font-serif">
          My Delivery Tasks
        </h1>
      </div>

      {/* Task Cards Log */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            
            {/* Tag metadata */}
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                task.task_type.code === 'pickup' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {task.task_type.label}
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-400">
                {task.order.order_number}
              </span>
            </div>

            {/* Core Info */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block mb-1">
                Schedule date
              </span>
              <span className="text-xs font-semibold text-[#1a1d20] block">
                {task.scheduled_date ? new Date(task.scheduled_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            {task.notes && (
              <div className="bg-[#faf9f6] p-3 rounded-xl text-[10px] text-gray-500 italic">
                Notes: {task.notes}
              </div>
            )}

            {/* Action Toggles Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-50 text-xs">
              <div>
                <select
                  value={task.status.code}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] bg-white focus:outline-none"
                >
                  {taskStatuses.map((st) => (
                    <option key={st.code} value={st.code}>{st.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setActiveTaskId(task.id);
                  setTaskNote(task.notes || '');
                }}
                className="text-[10px] font-semibold text-[#cca43b] hover:text-[#b08b2c]"
              >
                + Add Note
              </button>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-50 rounded-3xl px-4 text-xs text-gray-400 leading-relaxed">
            All caught up! You currently have no pending dry-cleaning runs or deliveries scheduled.
          </div>
        )}
      </div>

      {/* Note modal */}
      {activeTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-xl">
            <h3 className="text-sm font-bold text-[#1a1d20] mb-4 font-serif">Intake Observations</h3>
            
            <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs">
              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="Count verification details, stain checks (e.g. 3 shirts, small coffee spot)..."
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-200 text-xs focus:outline-none bg-white text-gray-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTaskId(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#cca43b] text-black font-bold hover:bg-[#e0b84c]"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
