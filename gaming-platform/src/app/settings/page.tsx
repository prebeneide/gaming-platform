"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import BackButton from "@/components/BackButton";
import { usePopup } from "@/components/PopupProvider";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showPopup } = usePopup();
  
  // Display preferences
  const [timeFormat, setTimeFormat] = useState("12");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  
  // Load preferences from API
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPreferences();
    }
  }, [session]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch(`/api/user/preferences?userId=${session?.user?.id}`);
      const data = await response.json();
      
      if (data.preferences) {
        const prefs = data.preferences;
        setTimeFormat(prefs.timeFormat || "12");
        setDateFormat(prefs.dateFormat || "MM/DD/YYYY");
        setTimezone(prefs.timezone || "UTC");
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          preferences: {
            timeFormat,
            dateFormat,
            timezone,
          }
        })
      });

      if (response.ok) {
        showPopup({ type: 'success', message: 'Preferences saved successfully!' });
      } else {
        showPopup({ type: 'error', message: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showPopup({ type: 'error', message: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-2">
      <div className={
        "bg-neutral-950 rounded-2xl shadow-xl p-8 flex flex-col gap-8 w-full max-w-none md:w-11/12 lg:w-10/12 xl:w-9/12 mx-auto"
      }>
        {/* Back Button */}
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        
        {/* Account Information */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-white">Account Information</h2>
          <div className="text-lg text-gray-300 flex flex-col gap-1">
            <div><b>Email:</b> {session?.user?.email}</div>
            <div><b>Username:</b> {session?.user?.username}</div>
            <div><b>User ID:</b> {session?.user?.id}</div>
            <div><b>Registered:</b> 2024-05-01</div>
          </div>
        </section>
        
        
        {/* Display Preferences */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-white">Display Preferences</h2>
          
          {/* Time Format */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Time Format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  value="12"
                  checked={timeFormat === "12"}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="w-4 h-4"
                />
                <span>12-hour (3:45 PM)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  value="24"
                  checked={timeFormat === "24"}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="w-4 h-4"
                />
                <span>24-hour (15:45)</span>
              </label>
            </div>
          </div>

          {/* Date Format */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full bg-neutral-900 text-white px-4 py-2 rounded-lg"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-neutral-900 text-white px-4 py-2 rounded-lg"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Europe/Oslo">Oslo (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </section>
        
        {/* Delete Account */}
        <section className="mt-4 border-t border-gray-800 pt-4">
          <h2 className="text-lg font-semibold mb-2 text-red-400">Delete Account</h2>
          <p className="text-sm text-gray-400 mb-2">This action is irreversible. All your data will be lost.</p>
          <button type="button" className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition">Delete Account</button>
        </section>
      </div>
    </main>
  );
} 