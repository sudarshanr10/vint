import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { getColorForCategory } from "../utils/colors";
import PlaidLinkButton from "../components/PlaidLinkButton";

function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
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
        fetch("http://localhost:8000/plaid/transactions", {
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
        })),
        ...plaidData.map((t) => ({
          id: t.transaction_id,
          name: t.name,
          amount: t.amount,
          date: t.date,
          category: typeof t.category === "string" ? t.category: Array.isArray(t.category)? t.category.join(" > "): "Bank",
          description: t.name,
          source: "Plaid",
        })),
      ]
        .filter((tx) => {
          const d = new Date(tx.date);
          return !isNaN(d);
        })
        .filter((tx) => typeof tx.amount === "number" && tx.amount > 0);

      setTransactions(combined);
    } catch (e) {
      console.error("Unexpected error loading transactions:", e);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [navigate]);

  const handleAddTransaction = () => {
    navigate("/add-transaction");
  };

  return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">
            Your Transactions
          </h1>
          <button
            onClick={handleAddTransaction}
            className="px-5 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold text-base shadow hover:bg-[#1ed7a0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2de1a3] scale-100 hover:scale-105 active:scale-95"
          >
            + Add Transaction
          </button>
        </div>
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-6">
            <PlaidLinkButton onSuccess={() => fetchTransactions()} />
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
                    <th className="pb-2 w-1/5">Date</th>
                    <th className="pb-2 w-1/5">Category</th>
                    <th className="pb-2 w-1/5">Amount</th>
                    <th className="pb-2 w-1/5">Description</th>
                    <th className="pb-2 w-1/5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const color = getColorForCategory(transaction.category);
                    const dateStr = transaction.date;
                    const amount = Number(transaction.amount);
                    return (
                      <tr
                        key={transaction.id}
                        className="bg-[#101a2c]/80 rounded-xl shadow hover:bg-[#2de1a3]/10 transition"
                      >
                        <td
                          className="py-2 px-3 rounded-l-xl w-1/5"
                          style={{ color }}
                        >
                          {isNaN(new Date(dateStr))
                            ? "Invalid Date"
                            : new Date(dateStr).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 w-1/5" style={{ color }}>
                          {transaction.category}
                        </td>
                        <td
                          className="py-2 px-3 w-1/5 font-semibold"
                          style={{ color }}
                        >
                          ${amount > 0 ? amount.toFixed(2) : "0.00"}
                        </td>
                        <td className="py-2 px-3 w-1/5" style={{ color }}>
                          {transaction.description || "-"}
                        </td>
                        <td className="py-2 px-3 rounded-r-xl w-1/5">
                          <div className="flex justify-center space-x-3">
                            {transaction.source === "Manual" && (
                              <button
                                onClick={() =>
                                  navigate(`/edit/${transaction.id}`)
                                }
                                className="px-3 py-1 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold hover:bg-[#1ed7a0] transition"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                const jwt = localStorage.getItem("jwt");
                                const url =
                                  transaction.source === "Manual"
                                    ? `http://localhost:8000/transactions/${transaction.id}`
                                    : `http://localhost:8000/plaid/delete_transaction/${transaction.id}`;
                                await fetch(url, {
                                  method: "DELETE",
                                  headers: {
                                    Authorization: `Bearer ${jwt}`,
                                  },
                                });
                                setTransactions((curr) =>
                                  curr.filter((t) => t.id !== transaction.id)
                                );
                              }}
                              className="px-3 py-1 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
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
