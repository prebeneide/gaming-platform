"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [timeFormat, setTimeFormat] = useState("12");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState("en-US");
  const [saving, setSaving] = useState(false);
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/user/preferences?userId=${session.user.id}`);
        const data = await res.json();
        const prefs = data.preferences;
        if (prefs) {
          setTimeFormat(prefs.timeFormat || "12");
          setDateFormat(prefs.dateFormat || "MM/DD/YYYY");
          setTimezone(prefs.timezone || "UTC");
          setLocale(prefs.locale || "en-US");
        }
      } catch {}
    })();
  }, [session]);

  useEffect(() => {
    try {
      // Prefer native supportedValuesOf if available
      // @ts-ignore
      const tz = typeof Intl !== 'undefined' && Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : null;
      if (tz && Array.isArray(tz) && tz.length) {
        setTimezones(tz);
        if (!tz.includes(timezone)) setTimezone(tz.includes('UTC') ? 'UTC' : tz[0]);
        return;
      }
    } catch {}
    // Fallback minimal list if environment lacks full data
    setTimezones([
      'UTC','Europe/Oslo','Europe/London','Europe/Paris','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Asia/Tokyo','Australia/Sydney'
    ]);
  }, []);

  const save = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          preferences: { timeFormat, dateFormat, timezone, locale }
        })
      });
      if (!res.ok) {
        alert('Failed to save preferences');
      } else {
        alert('Preferences saved');
      }
    } catch {
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Display Preferences</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Time Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="timeFormat" value="12" checked={timeFormat === "12"} onChange={(e) => setTimeFormat(e.target.value)} className="w-4 h-4" />
                    <span>12-hour (3:45 PM)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="timeFormat" value="24" checked={timeFormat === "24"} onChange={(e) => setTimeFormat(e.target.value)} className="w-4 h-4" />
                    <span>24-hour (15:45)</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2">
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2">
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Locale</label>
                <select value={locale} onChange={(e) => setLocale(e.target.value)} className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2">
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="nb-NO">Norsk Bokmål</option>
                  <option value="sv-SE">Svenska</option>
                </select>
              </div>

              <button onClick={save} disabled={saving} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
            {/* Live Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
              <div className="p-4 bg-neutral-700 rounded-lg space-y-2 text-sm">
                {(() => {
                  const now = new Date();
                  const hour12 = timeFormat === '12';
                  const dateOpts: Intl.DateTimeFormatOptions = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
                  const timeOpts: Intl.DateTimeFormatOptions = { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12 };
                  let dateStr = new Intl.DateTimeFormat(locale, dateOpts).format(now);
                  if (dateFormat === 'DD/MM/YYYY') {
                    const p = dateStr.split('/');
                    if (p.length === 3) dateStr = `${p[1]}/${p[0]}/${p[2]}`;
                  } else if (dateFormat === 'YYYY-MM-DD') {
                    const p = dateStr.split('/');
                    if (p.length === 3) dateStr = `${p[2]}-${p[0]}-${p[1]}`;
                  }
                  const timeStr = new Intl.DateTimeFormat(locale, timeOpts).format(now);
                  return (
                    <>
                      <div><span className="text-neutral-300">Date:</span> <span className="text-white">{dateStr}</span></div>
                      <div><span className="text-neutral-300">Time:</span> <span className="text-white">{timeStr}</span></div>
                      <div><span className="text-neutral-300">Full:</span> <span className="text-white">{`${dateStr} ${timeStr}`}</span></div>
                      <div className="text-xs text-neutral-300">TZ: {timezone}, Locale: {locale}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


