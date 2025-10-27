"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FiPlus, FiMinus, FiDollarSign, FiClock, FiCheck, FiX } from "react-icons/fi";
import { usePopup } from "@/components/PopupProvider";
import BackButton from "@/components/BackButton";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'match_payment' | 'match_winning' | 'match_payout' | 'match_refund' | 'match_draw_refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

// Helper function to determine if transaction is a credit (money in) or debit (money out)
const isCredit = (type: string): boolean => {
  return ['deposit', 'match_payout', 'match_refund', 'match_draw_refund'].includes(type);
};

const isDebit = (type: string): boolean => {
  return ['withdrawal', 'match_payment'].includes(type);
};

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
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
        showPopup({ type: 'error', message: data.error || 'Failed to process deposit' });
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
        showPopup({ type: 'error', message: data.error || 'Failed to process withdrawal' });
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
                      <span className="text-gray-400">{new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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