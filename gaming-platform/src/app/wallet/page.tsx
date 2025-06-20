"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FiPlus, FiMinus, FiDollarSign, FiClock, FiCheck, FiX } from "react-icons/fi";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'match_payment' | 'match_winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export default function WalletPage() {
  const { data: session } = useSession();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Mock data for now - replace with actual API calls
  useEffect(() => {
    const fetchWalletData = async () => {
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

      if (response.ok) {
        const data = await response.json();
        // Refresh wallet data
        const walletResponse = await fetch('/api/wallet');
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWalletData(walletData);
        }
        setShowDepositModal(false);
        setDepositAmount("");
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process deposit');
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      alert('Failed to process deposit');
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
          description: `Withdrawal via MoonPay`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh wallet data
        const walletResponse = await fetch('/api/wallet');
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWalletData(walletData);
        }
        setShowWithdrawModal(false);
        setWithdrawAmount("");
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal');
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
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Wallet</h1>
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Current Balance</h2>
            <div className="text-5xl font-bold">${walletData?.balance.toFixed(2)}</div>
            <div className="text-sm opacity-80 mt-2">{walletData?.currency}</div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              <FiPlus />
              <span className="ml-2">Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pink-600 transition"
            >
              <FiMinus />
              <span className="ml-2">Withdraw</span>
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-neutral-900 rounded-xl p-6">
          <h3 className="text-2xl font-semibold mb-6">Transaction History</h3>
          
          <div className="space-y-4">
            {walletData?.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="font-semibold">{transaction.description}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-semibold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                  </div>
                  <div className="text-xl">
                    {getStatusIcon(transaction.status)}
                  </div>
                </div>
              </div>
            ))}
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