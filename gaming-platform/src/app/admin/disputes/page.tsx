"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiAlertTriangle, FiEye, FiCheck, FiX, FiRefreshCw, FiArrowLeft, FiUser, FiClock, FiDollarSign } from "react-icons/fi";
import Link from "next/link";
import TimeFormatter from "@/components/TimeFormatter";

interface Dispute {
  id: string;
  matchId: string;
  winnerId?: string;
  resultType: string;
  status: string;
  agreedBy: string[];
  disputedBy: string[];
  payoutAmount?: number;
  createdAt: string;
  match: {
    id: string;
    name: string;
    gameName: string;
    buyIn: number;
    potentialWinnings: number;
    createdAt: string;
    participants: Array<{
      id: string;
      userId: string;
      hasReportedResult: boolean;
      reportedWinnerId?: string;
      reportedResult?: string;
      proofImageUrl?: string;
      proofUploadedAt?: string;
      user: {
        id: string;
        username: string;
        displayName?: string;
        image?: string;
      };
    }>;
    creator: {
      id: string;
      username: string;
      displayName?: string;
      image?: string;
    };
  };
}

export default function AdminDisputesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchDisputes();
  }, [session, status, router]);

  const fetchDisputes = async () => {
    try {
      const response = await fetch("/api/admin/disputes");
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string, winnerId: string, resultType: string, adminNotes?: string) => {
    setResolving(true);
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          winnerId,
          resultType,
          adminNotes
        }),
      });

      if (response.ok) {
        // Remove resolved dispute from list
        setDisputes(disputes.filter(d => d.id !== disputeId));
        setSelectedDispute(null);
        alert("Dispute resolved successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
      alert("Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-sm" />
              Back to Admin
            </Link>
            <button
              onClick={fetchDisputes}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <FiRefreshCw className="text-sm" />
              Refresh
            </button>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FiAlertTriangle className="text-red-500" />
            Match Disputes
          </h1>
          <p className="text-neutral-400">Review and resolve match disputes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Total Disputes</p>
              <p className="text-2xl font-bold text-red-400">{disputes.length}</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400">{disputes.length}</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-green-400">
                ${disputes.reduce((sum, d) => sum + d.match.potentialWinnings, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-neutral-800 rounded-lg p-8 text-center border border-neutral-700">
              <FiCheck className="text-green-500 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Disputes</h3>
              <p className="text-neutral-400">All matches are running smoothly!</p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <div key={dispute.id} className="bg-neutral-800 rounded-lg p-6 border border-red-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-red-400">{dispute.match.name}</h3>
                    <p className="text-neutral-400">{dispute.match.gameName}</p>
                    <p className="text-sm text-neutral-500">
                      Created: <TimeFormatter date={dispute.match.createdAt} /> • 
                      Disputed: <TimeFormatter date={dispute.createdAt} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${dispute.match.potentialWinnings}</p>
                    <p className="text-sm text-neutral-400">Potential Winnings</p>
                  </div>
                </div>

                {/* Participants and their reports */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-3">Participant Reports:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dispute.match.participants.map((participant) => (
                      <div key={participant.id} className="bg-neutral-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={participant.user.image || "/default-avatar.svg"}
                            alt={participant.user.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{participant.user.displayName || participant.user.username}</p>
                            <p className="text-sm text-neutral-400">@{participant.user.username}</p>
                          </div>
                        </div>
                        
                        {participant.hasReportedResult ? (
                          <div>
                            <p className="text-sm">
                              <span className="text-neutral-400">Reported:</span> {participant.reportedResult}
                            </p>
                            {participant.reportedWinnerId && (
                              <p className="text-sm">
                                <span className="text-neutral-400">Winner:</span> {
                                  dispute.match.participants.find(p => p.userId === participant.reportedWinnerId)?.user.displayName || 
                                  dispute.match.participants.find(p => p.userId === participant.reportedWinnerId)?.user.username
                                }
                              </p>
                            )}
                            {participant.proofImageUrl && (
                              <div className="mt-2">
                                <img
                                  src={participant.proofImageUrl}
                                  alt="Proof"
                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(participant.proofImageUrl, '_blank')}
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                  Uploaded: <TimeFormatter date={participant.proofUploadedAt!} />
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">No report submitted</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <FiEye className="text-sm" />
                    View Details
                  </button>
                  
                  {/* Quick resolve buttons */}
                  <div className="flex gap-2">
                    {dispute.match.participants.map((participant) => (
                      <button
                        key={participant.userId}
                        onClick={() => resolveDispute(dispute.id, participant.userId, 'win')}
                        disabled={resolving}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors text-sm"
                      >
                        <FiCheck className="text-sm" />
                        {participant.user.displayName || participant.user.username}
                      </button>
                    ))}
                    <button
                      onClick={() => resolveDispute(dispute.id, '', 'draw')}
                      disabled={resolving}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg transition-colors text-sm"
                    >
                      <FiX className="text-sm" />
                      Draw
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
