"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { FiGlobe, FiPlus, FiTrash2, FiCheck, FiAlertCircle } from "react-icons/fi";

interface AllowedCountry {
  id: string;
  countryCode: string;
  countryName: string;
  isActive: boolean;
  minAge: number;
  restrictions?: any;
}

interface BlockedCountry {
  id: string;
  countryCode: string;
  countryName: string;
  isActive: boolean;
  reason?: string | null;
}

export default function AdminGeolocationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allowedCountries, setAllowedCountries] = useState<AllowedCountry[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<BlockedCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAllowed, setShowAddAllowed] = useState(false);
  const [showAddBlocked, setShowAddBlocked] = useState(false);
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newMinAge, setNewMinAge] = useState(18);
  const [newReason, setNewReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchCountries();
  }, [session, status, router]);

  const fetchCountries = async () => {
    try {
      const response = await fetch("/api/admin/geolocation/countries");
      if (response.ok) {
        const data = await response.json();
        setAllowedCountries(data.allowed || []);
        setBlockedCountries(data.blocked || []);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllowed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newCountryCode || !newCountryName) {
      setError("Country code and name are required");
      return;
    }

    if (newCountryCode.length !== 2) {
      setError("Country code must be 2 characters (e.g., NO, US, GB)");
      return;
    }

    try {
      const response = await fetch("/api/admin/geolocation/countries/allowed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: newCountryCode.toUpperCase(),
          countryName: newCountryName,
          minAge: newMinAge,
        }),
      });

      if (response.ok) {
        setSuccess("Allowed country added successfully");
        setNewCountryCode("");
        setNewCountryName("");
        setNewMinAge(18);
        setShowAddAllowed(false);
        await fetchCountries();
      } else {
        const data = await response.json();
        setError(data.error || data.details || "Failed to add allowed country");
        console.error("Error response:", data);
      }
    } catch (err) {
      console.error("Error adding allowed country:", err);
      setError("Network error. Please check your connection and try again.");
    }
  };

  const handleAddBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newCountryCode || !newCountryName) {
      setError("Country code and name are required");
      return;
    }

    if (newCountryCode.length !== 2) {
      setError("Country code must be 2 characters (e.g., NO, US, GB)");
      return;
    }

    try {
      const response = await fetch("/api/admin/geolocation/countries/blocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: newCountryCode.toUpperCase(),
          countryName: newCountryName,
          reason: newReason || undefined,
        }),
      });

      if (response.ok) {
        setSuccess("Blocked country added successfully");
        setNewCountryCode("");
        setNewCountryName("");
        setNewReason("");
        setShowAddBlocked(false);
        await fetchCountries();
      } else {
        const data = await response.json();
        setError(data.error || data.details || "Failed to add blocked country");
        console.error("Error response:", data);
      }
    } catch (err) {
      console.error("Error adding blocked country:", err);
      setError("Network error. Please check your connection and try again.");
    }
  };

  const handleToggleAllowed = async (countryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/geolocation/countries/allowed/${countryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchCountries();
        setSuccess(`Country ${!isActive ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update country");
      }
    } catch (error) {
      console.error("Error toggling allowed country:", error);
      setError("Failed to update country");
    }
  };

  const handleDeleteAllowed = async (countryId: string) => {
    if (!confirm("Are you sure you want to delete this allowed country?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/geolocation/countries/allowed/${countryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCountries();
        setSuccess("Country removed successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to delete country");
      }
    } catch (error) {
      console.error("Error deleting allowed country:", error);
      setError("Failed to delete country");
    }
  };

  const handleToggleBlocked = async (countryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/geolocation/countries/blocked/${countryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchCountries();
        setSuccess(`Country ${!isActive ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update country");
      }
    } catch (error) {
      console.error("Error toggling blocked country:", error);
      setError("Failed to update country");
    }
  };

  const handleDeleteBlocked = async (countryId: string) => {
    if (!confirm("Are you sure you want to delete this blocked country?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/geolocation/countries/blocked/${countryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCountries();
        setSuccess("Country removed successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to delete country");
      }
    } catch (error) {
      console.error("Error deleting blocked country:", error);
      setError("Failed to delete country");
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FiGlobe className="text-purple-400" />
              Geolocation Management
            </h1>
            <p className="text-neutral-400 mt-2">
              Manage allowed and blocked countries for geofencing
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <FiAlertCircle className="text-red-400 text-xl" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 flex items-center gap-3">
            <FiCheck className="text-green-400 text-xl" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Allowed Countries */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Allowed Countries</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Countries where users can make deposits and join matches with buy-in
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddAllowed(true);
                setShowAddBlocked(false);
                setError("");
                setSuccess("");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <FiPlus className="text-sm" />
              Add Allowed Country
            </button>
          </div>

          {showAddAllowed && (
            <div className="p-6 border-b border-neutral-700 bg-neutral-750">
              <form onSubmit={handleAddAllowed} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Country Code (ISO 3166-1 alpha-2)
                    </label>
                    <input
                      type="text"
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                      placeholder="e.g., NO, US, GB"
                      maxLength={2}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Country Name
                    </label>
                    <input
                      type="text"
                      value={newCountryName}
                      onChange={(e) => setNewCountryName(e.target.value)}
                      placeholder="e.g., Norway, United States"
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Minimum Age (default: 18)
                  </label>
                  <input
                    type="number"
                    value={newMinAge}
                    onChange={(e) => setNewMinAge(parseInt(e.target.value) || 18)}
                    min={18}
                    max={25}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Add Country
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAllowed(false);
                      setNewCountryCode("");
                      setNewCountryName("");
                      setNewMinAge(18);
                      setError("");
                    }}
                    className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-neutral-700">
            {allowedCountries.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">
                No allowed countries configured. Add countries to allow access.
              </div>
            ) : (
              allowedCountries.map((country) => (
                <div
                  key={country.id}
                  className="p-4 flex items-center justify-between hover:bg-neutral-750 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{country.countryName}</span>
                      <span className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-300">
                        {country.countryCode}
                      </span>
                      {country.isActive ? (
                        <span className="px-2 py-1 bg-green-600 rounded text-xs text-white">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-600 rounded text-xs text-white">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400 mt-1">
                      Minimum age: {country.minAge}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAllowed(country.id, country.isActive)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        country.isActive
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {country.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteAllowed(country.id)}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Countries */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Blocked Countries</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Countries where users cannot make deposits or join matches with buy-in
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddBlocked(true);
                setShowAddAllowed(false);
                setError("");
                setSuccess("");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <FiPlus className="text-sm" />
              Add Blocked Country
            </button>
          </div>

          {showAddBlocked && (
            <div className="p-6 border-b border-neutral-700 bg-neutral-750">
              <form onSubmit={handleAddBlocked} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Country Code (ISO 3166-1 alpha-2)
                    </label>
                    <input
                      type="text"
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                      placeholder="e.g., US, CN, RU"
                      maxLength={2}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Country Name
                    </label>
                    <input
                      type="text"
                      value={newCountryName}
                      onChange={(e) => setNewCountryName(e.target.value)}
                      placeholder="e.g., United States, China"
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="e.g., Legal restrictions, compliance requirements"
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Add Country
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBlocked(false);
                      setNewCountryCode("");
                      setNewCountryName("");
                      setNewReason("");
                      setError("");
                    }}
                    className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-neutral-700">
            {blockedCountries.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">
                No blocked countries. All countries are allowed by default.
              </div>
            ) : (
              blockedCountries.map((country) => (
                <div
                  key={country.id}
                  className="p-4 flex items-center justify-between hover:bg-neutral-750 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{country.countryName}</span>
                      <span className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-300">
                        {country.countryCode}
                      </span>
                      {country.isActive ? (
                        <span className="px-2 py-1 bg-red-600 rounded text-xs text-white">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-600 rounded text-xs text-white">
                          Inactive
                        </span>
                      )}
                    </div>
                    {country.reason && (
                      <p className="text-sm text-neutral-400 mt-1">
                        Reason: {country.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBlocked(country.id, country.isActive)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        country.isActive
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {country.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteBlocked(country.id)}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <FiAlertCircle className="text-blue-400" />
            How Geofencing Works
          </h3>
          <ul className="text-sm text-neutral-300 space-y-1 list-disc list-inside">
            <li>If <strong>blocked countries</strong> are configured, those countries are blocked regardless of allowed list</li>
            <li>If <strong>allowed countries</strong> are configured (and no blocked countries), only listed countries are allowed</li>
            <li>If neither list exists, all countries are allowed by default</li>
            <li>Users&apos; locations are automatically detected via IP geolocation on first deposit/match action</li>
            <li>Admin can override individual user restrictions from the user detail page</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

