"use client";

import { useEffect, useState } from "react";
import { FaSpinner, FaSave } from "react-icons/fa";
import { adminApi } from "@/lib/api";

type Setting = {
  key: string;
  value: string;
  label?: string;
  description?: string;
  category: string;
  valueType: string;
};

export default function FinancialSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listFinancialSettings();
      const data = res.data?.data ?? res.data;
      const items = (data || []) as Setting[];
      setSettings(items);
      const map: Record<string, string> = {};
      items.forEach((s) => { map[s.key] = s.value; });
      setDraft(map);
    } catch {
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    try {
      await adminApi.updateFinancialSetting(key, draft[key]);
      await load();
    } finally {
      setSaving(null);
    }
  };

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Financial Settings</h1>
        <p className="text-sm text-gray-500">Commission, escrow, gateways, receipts — managed in database</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-gray-400" /></div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white border rounded-xl p-4">
            <h2 className="font-medium capitalize mb-3">{category}</h2>
            <div className="space-y-4">
              {items.map((s) => (
                <div key={s.key} className="grid sm:grid-cols-[1fr_200px_auto] gap-2 items-start">
                  <div>
                    <p className="text-sm font-medium">{s.label || s.key}</p>
                    {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                  </div>
                  <input
                    value={draft[s.key] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => save(s.key)}
                    disabled={saving === s.key}
                    className="px-3 py-2 text-sm border rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    {saving === s.key ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
