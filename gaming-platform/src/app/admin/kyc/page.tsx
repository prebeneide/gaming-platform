"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AdminLayout from "@/components/AdminLayout";
import TimeFormatter from "@/components/TimeFormatter";
import { FiCheck, FiX, FiSearch, FiRefreshCw, FiTrash2 } from "react-icons/fi";

interface KycItem {
  id: string;
  user: { id: string; username: string; email: string; displayName?: string };
  status: string;
  provider: string;
  dob?: string;
  country?: string;
  createdAt: string;
}

export default function AdminKycPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diag, setDiag] = useState<any>(null);

  useEffect(() => {
    if (status === "loading") return;
    fetchItems();
    fetchDiagnostics();
  }, [status]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    try {
      if (!confirm('Run cleanup now? This will delete stale evidences from storage.')) return;
      const res = await fetch('/api/admin/kyc/cleanup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed cleanup');
      alert(`Cleanup complete. Deleted evidences: ${data.cleaned}. Retention: ${data.retentionDays} days.`);
    } catch (e: any) {
      alert(e?.message || 'Cleanup failed');
    }
  };

  const decide = async (id: string, action: 'approve'|'reject') => {
    if (!confirm(`Are you sure you want to ${action} this verification?`)) return;
    const reason = action === 'reject' ? prompt('Reason (optional)') || '' : '';
    const res = await fetch(`/api/admin/kyc/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }) });
    if (res.ok) fetchItems(); else alert('Failed');
  };

  const fetchDiagnostics = async () => {
    const r = await fetch('/api/admin/kyc/diagnostics');
    const d = await r.json();
    setDiag(d);
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-white">Loading KYC…</div>
      </AdminLayout>
    );
  }

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.user.username.toLowerCase().includes(q) ||
      i.user.email.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {diag && (
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <h2 className="text-xl font-semibold text-white mb-2">KYC Diagnostics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div>Feature enabled: <span className={`font-semibold ${diag.enabled ? 'text-green-400' : 'text-red-400'}`}>{String(diag.enabled)}</span></div>
                <div>Provider: <span className="font-semibold">{diag.settings?.provider}</span></div>
                <div>Storage: <span className="font-semibold">{diag.settings?.storage}</span></div>
                <div>Retention days: <span className="font-semibold">{diag.settings?.retentionDays}</span></div>
                <div>AWS SDK installed: <span className={`font-semibold ${diag.awsInstalled ? 'text-green-400' : 'text-red-400'}`}>{String(diag.awsInstalled)}</span></div>
              </div>
              <div className="space-y-1">
                <div>Env FEATURE_KYC: <span className="font-mono">{String(diag.env?.FEATURE_KYC)}</span></div>
                <div>Env KYC_PROVIDER: <span className="font-mono">{String(diag.env?.KYC_PROVIDER)}</span></div>
                <div>Env KYC_STORAGE: <span className="font-mono">{String(diag.env?.KYC_STORAGE)}</span></div>
                <div>S3 vars present: <span className={`font-semibold ${diag.env?.S3_BUCKET && diag.env?.S3_REGION && diag.env?.S3_ACCESS_KEY_ID && diag.env?.S3_SECRET_ACCESS_KEY ? 'text-green-400' : 'text-red-400'}`}>{String(!!(diag.env?.S3_BUCKET && diag.env?.S3_REGION && diag.env?.S3_ACCESS_KEY_ID && diag.env?.S3_SECRET_ACCESS_KEY))}</span></div>
              </div>
            </div>
            {!diag.enabled && (
              <div className="mt-3 text-xs text-neutral-300 bg-neutral-700 rounded p-3">
                To enable KYC, set FEATURE_KYC=true and KYC_PROVIDER=manual in your environment and restart the server.
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">KYC Queue</h1>
          <div className="flex items-center gap-2">
            <button onClick={fetchItems} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
              <FiRefreshCw /> Refresh
            </button>
            <button onClick={runCleanup} className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg">
              <FiTrash2 /> Run cleanup
            </button>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users or IDs" className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg border border-neutral-700 divide-y divide-neutral-700">
          {filtered.length === 0 ? (
            <div className="p-6 text-neutral-400">No KYC items</div>
          ) : filtered.map(item => (
            <div key={item.id} className="p-6 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium">
                  {item.user.displayName || item.user.username} <span className="text-neutral-400">({item.user.email})</span>
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  ID: {item.id.slice(0,8)}… • Status: {item.status} • Provider: {item.provider}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Submitted: <TimeFormatter date={item.createdAt} />
                </div>
              </div>
              {item.status === 'pending' ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => decide(item.id, 'approve')} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white flex items-center gap-1"><FiCheck /> Approve</button>
                  <button onClick={() => decide(item.id, 'reject')} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white flex items-center gap-1"><FiX /> Reject</button>
                </div>
              ) : (
                <div className="text-sm text-neutral-300 flex-shrink-0">{item.status.toUpperCase()}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}


