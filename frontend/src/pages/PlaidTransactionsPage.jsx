import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PlaidTransactionsPage() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) {
        navigate("/");
        return;
        }
        fetch("http://localhost:8000/api/plaid/transactions", {
            headers: {
                Authorization: `Bearer ${jwt}`,
            }
        })
        .then((response) =>
            response.json().then((body) => (response.ok ? body : Promise.reject(body))))
        .then((data) => {
            setTransactions(data.transactions);
        })
        .catch((error) => {
            console.error("Failed to fetch transactions:", error);
            setError(error.detail || "Failed to load transactions");
        })
        .finally(() => setLoading(false));
    }, [navigate]);

      if (loading) return <p className="text-white">Loading transactions...</p>;
  if (error) return <p className="text-red-500 font-semibold">{error}</p>;

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Recent Bank Transactions</h1>
      <ul className="space-y-4">
        {transactions.map((txn) => (
          <li
            key={txn.transaction_id}
            className="bg-[#192447] p-4 rounded-xl shadow-md"
          >
            <div className="font-semibold text-lg">{txn.name}</div>
            <div className="text-sm text-gray-400">{txn.date}</div>
            <div className="text-green-400 font-bold">${txn.amount.toFixed(2)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default PlaidTransactionsPage;


//export default PlaidTransactionsPage;