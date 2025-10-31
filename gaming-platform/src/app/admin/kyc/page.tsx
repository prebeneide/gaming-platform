"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AdminLayout from "@/components/AdminLayout";
import TimeFormatter from "@/components/TimeFormatter";
import { FiCheck, FiX, FiSearch, FiRefreshCw, FiTrash2, FiCopy, FiSettings } from "react-icons/fi";

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
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [previousDiag, setPreviousDiag] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    fetchItems();
    fetchDiagnostics();
  }, [status]);

  useEffect(() => {
    if (diag && !diag.enabled) {
      setShowEnableModal(true);
    }
  }, [diag]);

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
    try {
      const r = await fetch(`/api/admin/kyc/diagnostics?t=${Date.now()}`, { cache: 'no-store' as RequestCache });
      const d = await r.json();
      if (diag) {
        setPreviousDiag(diag);
      }
      setDiag(d);
    } catch (e) {
      console.error('Failed to fetch diagnostics:', e);
    }
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
            <div className="mt-3 space-y-2">
              {diag.serverTime && (
                <div className="text-xs text-neutral-400 bg-neutral-900 rounded p-2">
                  <div>Server time: <span className="font-mono">{new Date(diag.serverTime).toLocaleString()}</span></div>
                  {diag.uptimeSec !== undefined && (
                    <div className="mt-1">
                      Uptime: <span className="font-mono">{Math.floor(diag.uptimeSec / 60)}m {diag.uptimeSec % 60}s</span>
                      {diag.uptimeSec > 300 && (
                        <span className="ml-2 text-yellow-400">⚠️ Restart required</span>
                      )}
                      {diag.uptimeSec < 60 && (
                        <span className="ml-2 text-green-400">✓ Recently restarted</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!diag.enabled && (
                <div className="text-xs text-neutral-300 bg-neutral-700 rounded p-3">
                  <button onClick={() => setShowEnableModal(true)} className="underline hover:text-white">Click here for step-by-step guide</button>
                </div>
              )}
            </div>
          </div>
        )}
        {showEnableModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-800 rounded-lg border border-neutral-700 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">How to Enable KYC</h2>
                <button onClick={() => setShowEnableModal(false)} className="text-neutral-400 hover:text-white text-2xl">✕</button>
              </div>
              <div className="space-y-4 text-sm text-neutral-300">
                <div className="bg-neutral-900 rounded p-4 space-y-2">
                  <p className="font-semibold text-white">Step 1: Locate .env.local file</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-neutral-800 px-3 py-2 rounded font-mono text-xs break-all">/Users/preben/Documents/Cursor/gaming-platform/.env.local</code>
                    <button onClick={() => { navigator.clipboard.writeText('/Users/preben/Documents/Cursor/gaming-platform/.env.local'); alert('Path copied!'); }} className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center gap-1">
                      <FiCopy className="text-xs" /> Copy path
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">If this file doesn't exist, create it in your project root.</p>
                </div>
                <div className="bg-neutral-900 rounded p-4 space-y-2">
                  <p className="font-semibold text-white">Step 2: Add these environment variables</p>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => { const r = await fetch('/api/admin/kyc/env-template'); const d = await r.json(); await navigator.clipboard.writeText(d.template); alert('Template copied to clipboard!'); }} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-1">
                      <FiCopy /> Copy .env template
                    </button>
                    <span className="text-xs text-neutral-400">Then paste into .env.local and fill in real S3 values</span>
                  </div>
                  {!diag?.awsInstalled && (
                    <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-200">
                      ⚠️ AWS SDK packages need to be installed. Run: <code className="bg-neutral-800 px-2 py-1 rounded">npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner</code>
                    </div>
                  )}
                </div>
                <div className="bg-neutral-900 rounded p-4 space-y-2">
                  <p className="font-semibold text-white">Step 3: Restart your dev server</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-neutral-800 px-3 py-2 rounded font-mono text-xs">npm run dev</code>
                    <button onClick={() => { navigator.clipboard.writeText('npm run dev'); alert('Command copied!'); }} className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center gap-1">
                      <FiCopy className="text-xs" /> Copy command
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">⚠️ Important: Stop your current server (Ctrl+C), then restart it from the project root.</p>
                </div>
                <div className="bg-neutral-900 rounded p-4">
                  <p className="font-semibold text-white mb-2">Quick checklist:</p>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li className={diag?.env?.FEATURE_KYC === 'true' ? 'text-green-400' : 'text-red-400'}>FEATURE_KYC=true {diag?.env?.FEATURE_KYC === 'true' ? '✓' : '✗'}</li>
                    <li className={diag?.env?.KYC_PROVIDER === 'manual' ? 'text-green-400' : 'text-red-400'}>KYC_PROVIDER=manual {diag?.env?.KYC_PROVIDER === 'manual' ? '✓' : '✗'}</li>
                    <li className={diag?.env?.KYC_STORAGE === 's3' ? 'text-green-400' : 'text-red-400'}>KYC_STORAGE=s3 {diag?.env?.KYC_STORAGE === 's3' ? '✓' : '✗'}</li>
                    <li className={diag?.env?.S3_BUCKET ? 'text-green-400' : 'text-red-400'}>S3 credentials configured {diag?.env?.S3_BUCKET ? '✓' : '✗'}</li>
                    <li className={diag?.awsInstalled ? 'text-green-400' : 'text-red-400'}>AWS SDK installed {diag?.awsInstalled ? '✓' : '✗'}</li>
                  </ul>
                </div>
                {diag && (
                  <div className="bg-neutral-900 rounded p-4 space-y-1">
                    <p className="font-semibold text-white mb-2">Server Status:</p>
                    <div className="text-xs space-y-1">
                      <div>Server time: <span className="font-mono text-neutral-300">{diag.serverTime ? new Date(diag.serverTime).toLocaleString() : 'N/A'}</span></div>
                      <div>Process ID: <span className="font-mono text-neutral-300">{diag.pid || 'N/A'}</span></div>
                      <div>Uptime: <span className="font-mono text-neutral-300">{diag.uptimeSec !== undefined ? `${diag.uptimeSec}s` : 'N/A'}</span></div>
                      {diag.envFileInfo && (
                        <div className="mt-2 pt-2 border-t border-neutral-700">
                          <div className="font-semibold text-white mb-1">.env.local file check:</div>
                          {diag.envFileInfo.exists ? (
                            <>
                              <div className="text-green-400">✓ File exists</div>
                              <div className="text-neutral-400 text-[10px] mt-1 break-all">Path: {diag.envFileInfo.path}</div>
                              <div className="text-neutral-400 text-[10px]">CWD: {diag.envFileInfo.cwd}</div>
                              {diag.envFileInfo.featureKycRaw && (
                                <div className="mt-2 p-2 bg-neutral-800 rounded">
                                  <div className="text-xs font-semibold text-white mb-1">FEATURE_KYC line found:</div>
                                  <code className="text-xs font-mono text-neutral-300 bg-neutral-900 px-2 py-1 rounded block break-all">
                                    {diag.envFileInfo.featureKycRaw}
                                  </code>
                                  {diag.envFileInfo.formatIssue && (
                                    <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-200">
                                      ⚠️ Format issue detected: {diag.envFileInfo.formatIssue}
                                    </div>
                                  )}
                                </div>
                              )}
                              {diag.envFileInfo.preview && diag.envFileInfo.preview.length > 0 && (
                                <div className="mt-2 p-2 bg-neutral-800 rounded text-[10px] font-mono">
                                  <div className="font-semibold text-white mb-1">KYC-related lines in file:</div>
                                  {diag.envFileInfo.preview.map((line: string, i: number) => (
                                    <div key={i} className="text-neutral-300 break-all">{line.trim() || '(empty line)'}</div>
                                  ))}
                                </div>
                              )}
                              {diag.env?.FEATURE_KYC !== 'true' && (
                                <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-200">
                                  ⚠️ File exists but FEATURE_KYC is not loaded. Common fixes:<br />
                                  1. Make sure line reads exactly: <code className="bg-neutral-800 px-1 rounded">FEATURE_KYC=true</code> (no quotes, no spaces around =)<br />
                                  2. Save the file<br />
                                  3. Restart server completely (Ctrl+C, then npm run dev)<br />
                                  4. Check that server is running from: <code className="bg-neutral-800 px-1 rounded text-[10px]">{diag.envFileInfo?.cwd || 'project root'}</code>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-red-400">
                              ✗ File not found at: {diag.envFileInfo.expectedPath || diag.envFileInfo.path}
                              <div className="text-neutral-400 text-[10px] mt-1">CWD: {diag.envFileInfo.cwd || diag.envFileInfo.expectedPath?.replace('/.env.local', '')}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {previousDiag && previousDiag.pid && diag.pid && previousDiag.pid !== diag.pid && (
                        <div className="mt-2 p-2 bg-green-900/30 border border-green-700 rounded text-xs text-green-200">
                          ✓ Server appears to have restarted (new process ID detected)
                        </div>
                      )}
                      {previousDiag && previousDiag.pid && diag.pid && previousDiag.pid === diag.pid && (
                        <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-200">
                          ⚠️ Same process ID detected. Did you restart the server?
                        </div>
                      )}
                      {diag.uptimeSec !== undefined && diag.uptimeSec > 300 && (
                        <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-200">
                          ⚠️ Server uptime is {Math.floor(diag.uptimeSec / 60)} minutes. Restart required to load new .env variables.
                        </div>
                      )}
                      {diag.uptimeSec !== undefined && diag.uptimeSec < 60 && (
                        <div className="mt-2 p-2 bg-green-900/30 border border-green-700 rounded text-xs text-green-200">
                          ✓ Server was recently restarted (uptime: {diag.uptimeSec}s)
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={async () => { 
                      setCheckingStatus(true);
                      try {
                        const r = await fetch(`/api/admin/kyc/diagnostics?t=${Date.now()}`, { cache: 'no-store' as RequestCache });
                        const d = await r.json();
                        if (diag) {
                          setPreviousDiag(diag);
                        }
                        setDiag(d);
                        setCheckingStatus(false);
                        if (d?.enabled) {
                          setShowEnableModal(false);
                          alert('KYC is now enabled! ✓');
                        } else {
                          const issues = [];
                          if (d?.env?.FEATURE_KYC !== 'true') issues.push('FEATURE_KYC must be "true"');
                          if (d?.env?.KYC_PROVIDER !== 'manual') issues.push('KYC_PROVIDER must be "manual"');
                          if (d?.uptimeSec && d.uptimeSec > 60) issues.push(`Server not restarted (uptime: ${Math.floor(d.uptimeSec / 60)} min)`);
                          alert(`KYC is still disabled.\n\nIssues:\n${issues.join('\n') || 'Unknown issue. Check .env.local and restart server.'}`);
                        }
                      } catch (e) {
                        setCheckingStatus(false);
                        alert('Failed to check status. Make sure server is running.');
                      }
                    }} 
                    disabled={checkingStatus}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingStatus ? 'Checking...' : "I've restarted - check status"}
                  </button>
                  <button onClick={() => setShowEnableModal(false)} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg">
                    Close
                  </button>
                </div>
              </div>
            </div>
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
            <button
              onClick={async () => {
                try {
                  const r = await fetch('/api/admin/kyc/test-s3');
                  const d = await r.json();
                  if (!r.ok || !d.ok) throw new Error(d.error || d.reason || 'S3 test failed');
                  alert('S3 presign test OK');
                } catch (e: any) {
                  alert(e?.message || 'S3 test failed');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
            >
              Test S3
            </button>
            <button
              onClick={async () => {
                try {
                  const r = await fetch('/api/admin/kyc/env-template');
                  const d = await r.json();
                  await navigator.clipboard.writeText(d.template);
                  alert('Copied .env template to clipboard');
                } catch {
                  alert('Failed to copy template');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
            >
              Copy .env template
            </button>
            <button
              onClick={() => setShowEnableModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              <FiSettings /> How to Enable
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


