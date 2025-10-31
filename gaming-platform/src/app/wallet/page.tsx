"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FiPlus, FiMinus, FiDollarSign, FiClock, FiCheck, FiX } from "react-icons/fi";
import { usePopup } from "@/components/PopupProvider";
import BackButton from "@/components/BackButton";
import TimeFormatter from "@/components/TimeFormatter";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'match_payment' | 'match_winning' | 'match_payout' | 'match_refund' | 'match_draw_refund' | 'admin_deposit' | 'admin_withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

// Helper function to determine if transaction is a credit (money in) or debit (money out)
const isCredit = (type: string): boolean => {
  return ['deposit', 'match_payout', 'match_refund', 'match_draw_refund', 'admin_deposit'].includes(type);
};

const isDebit = (type: string): boolean => {
  return ['withdrawal', 'match_payment', 'admin_withdrawal'].includes(type);
};

interface KycStatus {
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  reason?: string | null;
  createdAt?: string | null;
  decidedAt?: string | null;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
  kycStatus?: KycStatus | null;
  kycEnabled?: boolean;
}

export default function WalletPage() {
  const { data: session } = useSession();
  const { showPopup } = usePopup();
  const searchParams = useSearchParams();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Check if we should open deposit modal from URL
  useEffect(() => {
    const depositParam = searchParams.get('deposit');
    if (depositParam === 'true') {
      setShowDepositModal(true);
      // Clean up URL parameter
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/wallet');
      }
    }
  }, [searchParams]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        console.error('Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleDeposit = async () => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deposit',
          amount: parseFloat(depositAmount),
          description: `Deposit via MoonPay`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setWalletData(prevData => {
          if (!prevData) return null;
          return {
            ...prevData,
            transactions: [data.transaction, ...prevData.transactions]
          };
        });
        setShowDepositModal(false);
        setDepositAmount("");
      } else {
        // Handle KYC-related errors with clear messages
        if (data.status === 'not_started' || data.status === 'rejected' || data.action === 'verify_identity') {
          showPopup({ 
            type: 'error', 
            message: `${data.message || data.error || 'Identity verification required'}\n\nRedirecting to verification page...`
          });
          // Redirect after showing popup
          setTimeout(() => {
            window.location.href = data.redirectTo || '/kyc';
          }, 2000);
        } else if (data.status === 'pending' || data.action === 'pending_review') {
          showPopup({ 
            type: 'error', 
            message: `${data.message || 'Your identity verification is under review. We\'ll notify you once it\'s been processed.'}\n\nYou can check your status in Settings.`
          });
        } else {
          showPopup({ type: 'error', message: data.message || data.error || 'Failed to process deposit' });
        }
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      showPopup({ type: 'error', message: 'Failed to process deposit' });
    }
  };

  const handleWithdraw = async () => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'withdrawal',
          amount: parseFloat(withdrawAmount),
          description: `Withdrawal`
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        setWalletData(prevData => {
          if (!prevData) return null;
          return {
            ...prevData,
            transactions: [data.transaction, ...prevData.transactions]
          };
        });
        setShowWithdrawModal(false);
        setWithdrawAmount("");
      } else {
        // Handle KYC-related errors with clear messages
        if (data.status === 'not_started' || data.status === 'rejected' || data.action === 'verify_identity') {
          showPopup({ 
            type: 'error', 
            message: `${data.message || data.error || 'Identity verification required'}\n\nRedirecting to verification page...`
          });
          // Redirect after showing popup
          setTimeout(() => {
            window.location.href = data.redirectTo || '/kyc';
          }, 2000);
        } else if (data.status === 'pending' || data.action === 'pending_review') {
          showPopup({ 
            type: 'error', 
            message: `${data.message || 'Your identity verification is under review. We\'ll notify you once it\'s been processed.'}\n\nYou can check your status in Settings.`
          });
        } else {
          showPopup({ type: 'error', message: data.message || data.error || 'Failed to process withdrawal' });
        }
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      showPopup({ type: 'error', message: 'Failed to process withdrawal' });
    }
  };

  const handleConfirmDeposit = async (transactionId: string) => {
    try {
      const response = await fetch('/api/wallet/confirm-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      if (response.ok) {
        const data = await response.json();
        showPopup({ type: 'success', message: 'Deposit confirmed successfully!' });
        await fetchWalletData(); // Refetch to show updated balance and status
      } else {
        const error = await response.json();
        showPopup({ type: 'error', message: error.error || 'Failed to confirm deposit' });
      }
    } catch (error) {
      console.error('Error confirming deposit:', error);
      showPopup({ type: 'error', message: 'Failed to confirm deposit' });
    }
  };

  const handleConfirmWithdrawal = async (transactionId: string) => {
    try {
      const response = await fetch('/api/wallet/confirm-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      if (response.ok) {
        const data = await response.json();
        showPopup({ type: 'success', message: 'Withdrawal confirmed successfully!' });
        await fetchWalletData(); // Refetch to show updated balance and status
      } else {
        const error = await response.json();
        showPopup({ type: 'error', message: error.error || 'Failed to confirm withdrawal' });
      }
    } catch (error) {
      console.error('Error confirming withdrawal:', error);
      showPopup({ type: 'error', message: 'Failed to confirm withdrawal' });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <div className="text-green-500"><FiPlus /></div>;
      case 'withdrawal':
        return <div className="text-red-500"><FiMinus /></div>;
      case 'match_payment':
        return <div className="text-orange-500"><FiDollarSign /></div>;
      case 'match_winning':
        return <div className="text-green-500"><FiDollarSign /></div>;
      default:
        return <div className="text-gray-500"><FiDollarSign /></div>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="text-green-500"><FiCheck /></div>;
      case 'pending':
        return <div className="text-yellow-500"><FiClock /></div>;
      case 'failed':
        return <div className="text-red-500"><FiX /></div>;
      default:
        return <div className="text-gray-500"><FiClock /></div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-8">Wallet</h1>
        
        {/* KYC Status Banner */}
        {walletData?.kycEnabled && walletData.kycStatus && (
          <div className={`rounded-xl p-4 mb-4 sm:mb-6 ${
            walletData.kycStatus.status === 'approved' 
              ? 'bg-green-900/30 border border-green-700' 
              : walletData.kycStatus.status === 'pending'
              ? 'bg-yellow-900/30 border border-yellow-700'
              : walletData.kycStatus.status === 'rejected'
              ? 'bg-red-900/30 border border-red-700'
              : 'bg-blue-900/30 border border-blue-700'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                walletData.kycStatus.status === 'approved' 
                  ? 'text-green-400' 
                  : walletData.kycStatus.status === 'pending'
                  ? 'text-yellow-400'
                  : walletData.kycStatus.status === 'rejected'
                  ? 'text-red-400'
                  : 'text-blue-400'
              }`}>
                {walletData.kycStatus.status === 'approved' ? (
                  <FiCheck className="text-xl" />
                ) : walletData.kycStatus.status === 'pending' ? (
                  <FiClock className="text-xl" />
                ) : walletData.kycStatus.status === 'rejected' ? (
                  <FiX className="text-xl" />
                ) : (
                  <FiClock className="text-xl" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  {walletData.kycStatus.status === 'approved' 
                    ? 'Identity Verified' 
                    : walletData.kycStatus.status === 'pending'
                    ? 'Identity Verification Pending'
                    : walletData.kycStatus.status === 'rejected'
                    ? 'Identity Verification Required'
                    : 'Identity Verification Required'}
                </h3>
                <p className="text-sm text-neutral-300 mb-2">
                  {walletData.kycStatus.status === 'approved' 
                    ? 'Your identity has been verified. You can make deposits and withdrawals.'
                    : walletData.kycStatus.status === 'pending'
                    ? 'Your identity verification is under review. We\'ll notify you once it\'s been processed, typically within 1-2 business days.'
                    : walletData.kycStatus.status === 'rejected'
                    ? walletData.kycStatus.reason 
                      ? `Your verification was rejected: ${walletData.kycStatus.reason}. Please submit a new verification with corrected documents.`
                      : 'Your verification was rejected. Please submit a new verification with correct documents.'
                    : 'To make deposits or withdrawals, you must complete identity verification. This helps us comply with regulations and keep your account secure.'}
                </p>
                {walletData.kycStatus.status !== 'approved' && (
                  <button
                    onClick={() => window.location.href = '/kyc'}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      walletData.kycStatus.status === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : walletData.kycStatus.status === 'pending'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {walletData.kycStatus.status === 'pending' ? 'View Status' : 'Verify Identity'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="text-center">
            <h2 className="text-lg sm:text-2xl font-semibold mb-1 sm:mb-2">Current Balance</h2>
            <div className="text-3xl sm:text-5xl font-bold">${walletData?.balance.toFixed(2)}</div>
            <div className="text-xs sm:text-sm opacity-80 mt-1 sm:mt-2">{walletData?.currency}</div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6 justify-center">
            <button
              onClick={() => setShowDepositModal(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
            >
              <FiPlus />
              <span className="ml-2">Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pink-600 transition flex items-center justify-center"
            >
              <FiMinus />
              <span className="ml-2">Withdraw</span>
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-neutral-900 rounded-xl p-3 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Transaction History</h3>
          
          <div className="space-y-2 sm:space-y-4">
            {walletData?.transactions.map((transaction) => {
              const isCreditTransaction = isCredit(transaction.type);
              const isDebitTransaction = isDebit(transaction.type);
              const displayAmount = Math.abs(transaction.amount);
              const sign = isCreditTransaction ? '+' : '-';
              const amountColor = isCreditTransaction ? 'text-green-400' : 'text-red-400';

              return (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-neutral-800 rounded-lg gap-2 sm:gap-0 overflow-x-auto">
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Ikon til venstre - Credit = green, Debit = red */}
                    <div className="text-xl sm:text-2xl">
                      {isCreditTransaction && <span className="text-green-500"><FiPlus /></span>}
                      {isDebitTransaction && <span className="text-red-500"><FiMinus /></span>}
                    </div>
                    <div className="flex flex-col text-xs sm:text-base">
                      <span className="font-semibold">{transaction.description}</span>
                      <span className="text-gray-400">
                        <TimeFormatter date={transaction.createdAt} />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                    <span className={`font-bold ${amountColor} text-sm sm:text-base`}>
                      {sign}${displayAmount.toFixed(2)}
                    </span>
                    {getStatusIcon(transaction.status)}
                    {/* Godta-knapper for pending transactions */}
                    {transaction.status === 'pending' && (
                      <div className="flex gap-2">
                        {transaction.type === 'deposit' && (
                          <button
                            onClick={() => handleConfirmDeposit(transaction.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            Godta
                          </button>
                        )}
                        {transaction.type === 'withdrawal' && (
                          <button
                            onClick={() => handleConfirmWithdrawal(transaction.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            Godta
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4">Deposit Funds</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount (USD)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
                placeholder="Enter amount"
                min="1"
                step="0.01"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4">Withdraw Funds</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount (USD)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
                placeholder="Enter amount"
                min="1"
                max={walletData?.balance}
                step="0.01"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 