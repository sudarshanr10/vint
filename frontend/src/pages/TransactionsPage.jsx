import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { CATEGORY_COLORS, getColorForCategory } from "../utils/colors";

function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/");
      return;
    }

    fetch("http://localhost:8000/transactions", {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((res) =>
        res.json().then((body) => (res.ok ? body : Promise.reject(body)))
      )
      .then((data) => setTransactions(data))
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        setError(err.detail || "Failed to load transactions");
      });
  }, [navigate]);

  const handleAddTransaction = () => {
    navigate("/add-transaction");
  };

  return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">Your Transactions</h1>
          <button
            onClick={handleAddTransaction}
            className="px-5 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold text-base shadow hover:bg-[#1ed7a0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2de1a3] scale-100 hover:scale-105 active:scale-95"
          >
            + Add Transaction
          </button>
        </div>
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          {error && (
            <div className="text-red-400 mb-4 font-semibold">{error}</div>
          )}
          {transactions.length === 0 && !error ? (
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
                    return (
                      <tr
                        key={transaction.id}
                        className="bg-[#101a2c]/80 rounded-xl shadow hover:bg-[#2de1a3]/10 transition"
                      >
                        <td
                          className="py-2 px-3 rounded-l-xl w-1/5"
                          style={{ color }}
                        >
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 w-1/5" style={{ color }}>
                          {transaction.category}
                        </td>
                        <td className="py-2 px-3 w-1/5 font-semibold" style={{ color }}>
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 w-1/5" style={{ color }}>
                          {transaction.description || "-"}
                        </td>
                        <td className="py-2 px-3 rounded-r-xl w-1/5">
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => navigate(`/edit/${transaction.id}`)}
                              className="px-3 py-1 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold hover:bg-[#1ed7a0] transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                const jwt = localStorage.getItem("jwt");
                                await fetch(`http://localhost:8000/transactions/${transaction.id}`, {
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
