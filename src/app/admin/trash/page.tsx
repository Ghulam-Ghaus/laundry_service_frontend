'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';

export default function AdminTrash() {
  const [entityName, setEntityName] = useState('catalog_items');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrash() {
      try {
        setLoading(true);
        const data = await adminApi.getTrash(entityName);
        setRecords(data || []);
      } catch (err: any) {
        setError(err.message || 'Access Restrained.');
      } finally {
        setLoading(false);
      }
    }
    loadTrash();
  }, [entityName]);

  const handleRestore = async (id: string) => {
    try {
      await adminApi.restoreRecord(entityName, id);
      alert('Record restored successfully!');
      // Reload trash records
      const data = await adminApi.getTrash(entityName);
      setRecords(data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to restore record.');
    }
  };

  const entities = [
    { code: 'service_categories', label: 'Service Categories' },
    { code: 'catalog_items', label: 'Catalog Items' },
    { code: 'service_areas', label: 'Service Areas' },
    { code: 'time_slots', label: 'Time Slots' },
    { code: 'discounts', label: 'Discounts / Coupons' },
    { code: 'orders', label: 'Orders Log' },
  ];

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading recovery bins...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">🗑️</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restrained</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Admin permission rules prevent loading recovery bins. Verify session credentials.
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
        <Link href="/admin/settings" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Settings
        </Link>
        <Link href="/admin/audit-logs" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Audit Logs
        </Link>
        <Link href="/admin/trash" className="text-sm font-bold text-[#cca43b] border-b-2 border-[#cca43b] pb-2 px-1">
          Trash Bin
        </Link>
      </div>

      {/* Recoveries tables */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-[#1a1d20] font-serif">Deleted Records Archive</h2>
          
          <select
            value={entityName}
            onChange={(e) => {
              setEntityName(e.target.value);
              setRecords([]);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none"
          >
            {entities.map((ent) => (
              <option key={ent.code} value={ent.code}>{ent.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-4">Record ID</th>
                <th className="py-4">Identifiers / Info</th>
                <th className="py-4">Status</th>
                <th className="py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-mono text-gray-600">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50/50">
                  <td className="py-4 select-all text-gray-400">{rec.id}</td>
                  <td className="py-4 font-sans font-medium text-[#1a1d20]">
                    {rec.name || rec.order_number || rec.code || rec.label || 'No description identifier'}
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700">
                      Deleted
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleRestore(rec.id)}
                      className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors font-semibold font-sans"
                    >
                      Restore Record
                    </button>
                  </td>
                </tr>
              ))}

              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 font-sans text-gray-400">
                    No soft-deleted rows found in the selected category.
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
