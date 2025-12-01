import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { getColorForCategory } from "../utils/colors";
import PlaidLinkButton from "../components/PlaidLinkButton";

const TOGGLE_KEY = 'transactions_showAll';

function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(() => {
    const stored = localStorage.getItem(TOGGLE_KEY);
    return stored === null ? false : stored === 'true';
  });

  const fetchTransactions = useCallback(async (showDeleted = false) => {
    setLoading(true);
    setError("");
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        navigate("/");
        return;
      }

      const results = await Promise.allSettled([
        fetch("http://localhost:8000/transactions", {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
        fetch(`http://localhost:8000/plaid/${showDeleted ? 'all_transactions' : 'transactions'}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
      ]);

      // manual
      let manualData = [];
      if (results[0].status === "fulfilled") {
        const res = results[0].value;
        if (res.ok) manualData = await res.json();
        else console.error("Manual fetch error:", await res.json());
      } else {
        console.error("Manual fetch failed:", results[0].reason);
      }

      // plaid
      let plaidData = [];
      if (results[1].status === "fulfilled") {
        const res = results[1].value;
        if (res.ok) {
          const body = await res.json();
          plaidData = body.transactions || [];
        } else {
          console.error("Plaid fetch error:", await res.json());
        }
      } else {
        console.error("Plaid fetch failed:", results[1].reason);
      }

      // merge
      const combined = [
        ...manualData.map((t) => ({
          id: t.id,
          name: t.description,
          amount: t.amount,
          date: t.timestamp,
          category: t.category,
          description: t.description,
          source: "Manual",
          is_deleted: false,
        })),
        ...plaidData.map((t) => ({
          id: t.transaction_id,
          name: t.name,
          amount: t.amount,
          date: t.date,
          category: typeof t.category === "string" ? t.category: Array.isArray(t.category)? t.category.join(" > "): "Bank",
          description: t.name,
          source: "Plaid",
          is_deleted: t.is_deleted || false,
        })),
      ]
        .filter((tx) => {
          const d = new Date(tx.date);
          return !isNaN(d);
        })
        .filter((tx) => typeof tx.amount === "number" && tx.amount > 0)
        .filter((tx) => showDeleted || !tx.is_deleted);

      setTransactions(combined);
    } catch (e) {
      console.error("Unexpected error loading transactions:", e);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    fetchTransactions(showAll);
  }, [fetchTransactions, showAll]);

  const handleToggleShowAll = () => {
    setShowAll((prev) => {
      localStorage.setItem(TOGGLE_KEY, !prev);
      return !prev;
    });
  };

  const handleAddTransaction = () => {
    navigate("/add-transaction");
  };

  const handleDeleteTransaction = async (transaction) => {
    const jwt = localStorage.getItem("jwt");
    const url =
      transaction.source === "Manual"
        ? `http://localhost:8000/transactions/${transaction.id}`
        : `http://localhost:8000/plaid/delete_transaction/${transaction.id}`;
    
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.ok) {
        if (transaction.source === "Plaid") {
          await fetchTransactions(showAll);
          localStorage.setItem("vint_refresh_dashboard", Date.now().toString());
        } else {
          setTransactions((curr) =>
            curr.filter((t) => t.id !== transaction.id)
          );
          localStorage.setItem("vint_refresh_dashboard", Date.now().toString());
        }
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleRestoreTransaction = async (transaction) => {
    if (transaction.source !== "Plaid") return;
    
    const jwt = localStorage.getItem("jwt");
    try {
      const response = await fetch(`http://localhost:8000/plaid/restore_transaction/${transaction.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.ok) {
        await fetchTransactions(showAll);
          localStorage.setItem("vint_refresh_dashboard", Date.now().toString());
      } else {
        console.error("Failed to restore transaction");
      }
    } catch (error) {
      console.error("Error restoring transaction:", error);
    }
  };

  const handleRestoreAll = async () => {
    const jwt = localStorage.getItem("jwt");
    try {
      const response = await fetch("http://localhost:8000/plaid/restore_all_transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.ok) {
        await fetchTransactions(showAll);
        localStorage.setItem("vint_refresh_dashboard", Date.now().toString());

      } else {
        console.error("Failed to restore all transactions");
      }
    } catch (error) {
      console.error("Error restoring all transactions:", error);
    }
  };

  const deletedTransactions = transactions.filter(t => t.is_deleted);

  return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">
            Your Transactions
          </h1>
          <div className="flex items-center space-x-4">
            {/* Toggle Switch */}
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm font-medium">Hide Plaid</span>
              <button
                onClick={handleToggleShowAll}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2de1a3] focus:ring-offset-2 focus:ring-offset-[#0a1120] ${
                  showAll ? 'bg-[#2de1a3]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showAll ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-white text-sm font-medium">Show All</span>
            </div>
            
            {/* Restore All Button - only show when showing all and there are deleted transactions */}
            {showAll && deletedTransactions.length > 0 && (
              <button
                onClick={handleRestoreAll}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold text-sm shadow hover:bg-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Restore All ({deletedTransactions.length})
              </button>
            )}
            
            <button
              onClick={handleAddTransaction}
              className="px-5 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold text-base shadow hover:bg-[#1ed7a0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2de1a3] scale-100 hover:scale-105 active:scale-95"
            >
              + Add Transaction
            </button>
          </div>
        </div>
        
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-6">
            <PlaidLinkButton onSuccess={() => fetchTransactions(showAll)} />
          </div>
          
          {loading ? (
            <p className="text-gray-400">Loading transactions…</p>
          ) : error ? (
            <div className="text-red-400 mb-4 font-semibold">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-gray-400 text-lg font-medium">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[#2de1a3] text-lg">
                    <th className="pb-2 w-1/6">Date</th>
                    <th className="pb-2 w-1/6">Category</th>
                    <th className="pb-2 w-1/6">Amount</th>
                    <th className="pb-2 w-1/6">Description</th>
                    <th className="pb-2 w-1/6 text-center">Status</th>
                    <th className="pb-2 w-1/6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const color = getColorForCategory(transaction.category);
                    const dateStr = transaction.date;
                    const amount = Number(transaction.amount);
                    const isDeleted = transaction.is_deleted;
                    
                    return (
                      <tr
                        key={transaction.id}
                        className={`bg-[#101a2c]/80 rounded-xl shadow hover:bg-[#2de1a3]/10 transition ${
                          isDeleted ? 'opacity-60 italic' : ''
                        }`}
                      >
                        <td
                          className="py-2 px-3 rounded-l-xl w-1/6"
                          style={{ color: isDeleted ? '#6b7280' : color }}
                        >
                          {isNaN(new Date(dateStr))
                            ? "Invalid Date"
                            : new Date(dateStr).toLocaleDateString()}
                        </td>
                        <td 
                          className="py-2 px-3 w-1/6" 
                          style={{ color: isDeleted ? '#6b7280' : color }}
                        >
                          {transaction.category}
                        </td>
                        <td
                          className="py-2 px-3 w-1/6 font-semibold"
                          style={{ color: isDeleted ? '#6b7280' : color }}
                        >
                          ${amount > 0 ? amount.toFixed(2) : "0.00"}
                        </td>
                        <td 
                          className="py-2 px-3 w-1/6" 
                          style={{ color: isDeleted ? '#6b7280' : color }}
                        >
                          {transaction.description || "-"}
                        </td>
                        <td className="py-2 px-3 w-1/6 text-center">
                          {isDeleted ? (
                            <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                              Deleted
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 rounded-r-xl w-1/6">
                          <div className="flex justify-center space-x-2">
                            {transaction.source === "Manual" && !isDeleted && (
                              <button
                                onClick={() =>
                                  navigate(`/edit/${transaction.id}`)
                                }
                                className="px-3 py-1 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold hover:bg-[#1ed7a0] transition text-sm"
                              >
                                Edit
                              </button>
                            )}
                            
                            {isDeleted && transaction.source === "Plaid" && (
                              <button
                                onClick={() => handleRestoreTransaction(transaction)}
                                className="px-3 py-1 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition text-sm"
                              >
                                Restore
                              </button>
                            )}
                            
                            {!isDeleted && (
                              <button
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionsPage;
