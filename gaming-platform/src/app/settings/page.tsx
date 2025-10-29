"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import BackButton from "@/components/BackButton";
import { usePopup } from "@/components/PopupProvider";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showPopup } = usePopup();
  
  // Display preferences
  const [timeFormat, setTimeFormat] = useState("12");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});
  
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

  const validatePassword = () => {
    const errors: {
      current?: string;
      new?: string;
      confirm?: string;
    } = {};

    if (!currentPassword) {
      errors.current = "Current password is required";
    }

    if (!newPassword) {
      errors.new = "New password is required";
    } else if (newPassword.length < 8) {
      errors.new = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      errors.confirm = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirm = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        })
      });

      const data = await response.json();

      if (response.ok) {
        showPopup({ type: 'success', message: 'Password changed successfully!' });
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      } else {
        const errorMessage = data.error || 'Failed to change password';
        showPopup({ type: 'error', message: errorMessage });
        
        // Set specific error messages if available
        if (errorMessage.includes("Current password")) {
          setPasswordErrors({ current: errorMessage });
        } else if (errorMessage.includes("must be at least")) {
          setPasswordErrors({ new: errorMessage });
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showPopup({ type: 'error', message: 'Failed to change password' });
    } finally {
      setChangingPassword(false);
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
        
        
        {/* Change Password */}
        <section className="border-t border-gray-800 pt-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Change Password</h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordErrors({ ...passwordErrors, current: undefined });
                  }}
                  className={`w-full bg-neutral-900 text-white px-4 py-2 rounded-lg pr-10 ${
                    passwordErrors.current ? "border border-red-500" : ""
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordErrors.current && (
                <p className="text-red-400 text-sm mt-1">{passwordErrors.current}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordErrors({ ...passwordErrors, new: undefined });
                  }}
                  className={`w-full bg-neutral-900 text-white px-4 py-2 rounded-lg pr-10 ${
                    passwordErrors.new ? "border border-red-500" : ""
                  }`}
                  placeholder="Enter new password (min. 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-red-400 text-sm mt-1">{passwordErrors.new}</p>
              )}
              {newPassword && newPassword.length < 8 && !passwordErrors.new && (
                <p className="text-yellow-400 text-sm mt-1">Password must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordErrors({ ...passwordErrors, confirm: undefined });
                  }}
                  className={`w-full bg-neutral-900 text-white px-4 py-2 rounded-lg pr-10 ${
                    passwordErrors.confirm ? "border border-red-500" : ""
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="text-red-400 text-sm mt-1">{passwordErrors.confirm}</p>
              )}
              {confirmPassword && newPassword !== confirmPassword && !passwordErrors.confirm && (
                <p className="text-yellow-400 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </section>

        {/* Display Preferences */}
        <section className="border-t border-gray-800 pt-6">
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