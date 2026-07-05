'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';

export default function AdminSettings() {
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const list = await adminApi.getSettings();
        setSettingsList(list || []);

        // Map list to form state
        const values: Record<string, string> = {};
        list.forEach((item) => {
          const key = item.setting_key || item.key_name;
          if (key) {
            values[key] = item.setting_value !== undefined ? item.setting_value : (item.key_value || '');
          }
        });
        setFormData(values);
      } catch (err: any) {
        setError(err.message || 'Access Restrained. Settings loading failed.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleInputChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(formData);
      alert('System configurations saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update system variables.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#cca43b] text-sm font-semibold animate-pulse uppercase tracking-widest">
          Loading configurations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <span className="text-3xl mb-4">⚙️</span>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restrained</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          Admin permission rules prevent loading system configurations. Verify credentials.
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
        <Link href="/admin/settings" className="text-sm font-bold text-[#cca43b] border-b-2 border-[#cca43b] pb-2 px-1">
          Settings
        </Link>
        <Link href="/admin/audit-logs" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Audit Logs
        </Link>
        <Link href="/admin/trash" className="text-sm font-medium text-gray-500 hover:text-[#cca43b] pb-2 px-1">
          Trash Bin
        </Link>
      </div>

      {/* Editor Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm max-w-2xl">
        <h2 className="text-lg font-bold text-[#1a1d20] mb-6 font-serif border-b border-gray-100 pb-3">
          Configure System Settings
        </h2>

        <form onSubmit={handleFormSubmit} className="space-y-6 text-xs text-gray-500">
          {settingsList.map((item) => {
            const key = item.setting_key || item.key_name;
            if (!key) return null;
            return (
              <div key={item.id} className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  required
                  value={formData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#cca43b] text-xs bg-white text-gray-800"
                />
                <p className="text-[10px] text-gray-400">
                  {item.description || 'System-wide configuration value.'}
                </p>
              </div>
            );
          })}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#cca43b] hover:bg-[#e0b84c] shadow-lg shadow-[#cca43b]/10 transition-all cursor-pointer"
          >
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}
