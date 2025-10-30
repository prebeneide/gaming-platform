"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TimeFormatter from "@/components/TimeFormatter";

type ProviderResp = { enabled: boolean; settings: { provider: string } };

export default function KycWizardPage() {
  const { data: session } = useSession();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"intro" | "details" | "upload" | "done">("intro");
  const [kycId, setKycId] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/kyc/providers');
        const data: ProviderResp = await res.json();
        setEnabled(!!data?.enabled);
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!kycId) return;
    (async () => {
      const res = await fetch('/api/kyc/status');
      const data = await res.json();
      setStatus(data.verification);
    })();
  }, [kycId]);

  const canStart = consent && dob && country;

  const start = async () => {
    if (!canStart) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dob, country }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start');
      setKycId(data.verification.id);
      setStep('upload');
    } catch (e) {
      alert('Failed to start verification');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadOne = async (file: File, kind: string) => {
    if (!kycId) return;
    // Request presigned URL
    const pres = await fetch('/api/kyc/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kycId, kind, contentType: file.type || 'application/octet-stream' }) });
    const pdata = await pres.json();
    if (!pres.ok) throw new Error(pdata.error || 'presign failed');
    // PUT to S3
    const put = await fetch(pdata.url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
    if (!put.ok) throw new Error('upload failed');
    // Register evidence
    const ev = await fetch('/api/kyc/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kycId, kind, storageKey: pdata.key, storageProvider: pdata.storageProvider }) });
    if (!ev.ok) throw new Error('evidence save failed');
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>, kind: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSubmitting(true);
      await uploadOne(file, kind);
      const st = await fetch('/api/kyc/status');
      const data = await st.json();
      setStatus(data.verification);
      alert('Uploaded');
    } catch (err: any) {
      alert(err?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</main>
    );
  }

  if (!enabled) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Verification Unavailable</h1>
          <p className="text-neutral-400">Identity verification is currently disabled.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-xl mx-auto bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-6">
        <h1 className="text-2xl font-bold">Verify Your Identity</h1>

        {step === 'intro' && (
          <div className="space-y-4">
            <p className="text-neutral-300 text-sm">
              To comply with regulations, we may need to verify your age and identity. Your documents are stored securely and only reviewed by authorized staff.
            </p>
            <button onClick={() => setStep('details')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">Continue</button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <label className="block text-sm">Date of Birth
              <input type="date" value={dob} onChange={e=>setDob(e.target.value)} className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2" />
            </label>
            <label className="block text-sm">Country
              <input type="text" placeholder="NO, SE, US" value={country} onChange={e=>setCountry(e.target.value.toUpperCase())} className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
              I consent to the processing of my documents for verification.
            </label>
            <button disabled={!canStart || submitting} onClick={start} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">Start Verification</button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-neutral-300 text-sm">Upload photos of your ID. Accepted: passport, national ID, or driver’s license.</p>
            <div className="space-y-3">
              <label className="block text-sm">Front of ID
                <input type="file" accept="image/*" onChange={(e)=>handleFiles(e,'front')} className="mt-1 block" />
              </label>
              <label className="block text-sm">Back of ID (if applicable)
                <input type="file" accept="image/*" onChange={(e)=>handleFiles(e,'back')} className="mt-1 block" />
              </label>
              <label className="block text-sm">Selfie (optional)
                <input type="file" accept="image/*" onChange={(e)=>handleFiles(e,'selfie')} className="mt-1 block" />
              </label>
            </div>
            {status && (
              <div className="text-sm text-neutral-300 bg-neutral-800 rounded p-3">
                <div>Status: <span className="font-semibold capitalize">{status.status}</span></div>
                <div>Created: <TimeFormatter date={status.createdAt} /></div>
              </div>
            )}
            <button onClick={()=>setStep('done')} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg">Finish</button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Submitted</h2>
            <p className="text-neutral-300 text-sm">We will review your documents shortly. You’ll be notified when a decision is made.</p>
          </div>
        )}
      </div>
    </main>
  );
}


