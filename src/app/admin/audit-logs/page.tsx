'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await adminApi.getAuditLogs(page, 30, actionFilter || undefined);
        setLogs(data || []);
      } catch (err: any) {
        setError(err.message || 'Access Restrained.');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [page, actionFilter]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading audit trails...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">📜</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restrained</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Admin permission rules prevent loading system logs. Verify session credentials.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c]"
        >
          Retry Access
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      
      {/* Sidebar Admin Navigation Ribbon */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4">
        <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Orders Dashboard
        </Link>
        <Link href="/admin/receipt" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          New Receipt
        </Link>
        <Link href="/admin/settings" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Settings
        </Link>
        <Link href="/admin/audit-logs" className="text-sm font-bold text-[#cca43b] border-b-2 border-[#cca43b] pb-2 px-1">
          Audit Logs
        </Link>
        <Link href="/admin/trash" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Trash Bin
        </Link>
      </div>

      {/* Table Logs */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1a1d20] font-serif">Historical Change Traces</h2>
          <input
            type="text"
            placeholder="Filter by action (e.g. UPDATE)..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-4">Timestamp</th>
                <th className="py-4">Action</th>
                <th className="py-4">Entity</th>
                <th className="py-4">Record ID</th>
                <th className="py-4">Actor ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-mono text-gray-600">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="py-4 text-[10px] text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.action === 'INSERT' ? 'bg-green-50 text-green-700' :
                      log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 font-semibold text-gray-700">{log.table_name}</td>
                  <td className="py-4 text-gray-400 select-all">{log.record_id}</td>
                  <td className="py-4 text-gray-400 select-all">{log.actor_user_id || 'SYSTEM'}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 font-sans text-gray-400">
                    No change records found inside audit histories.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
