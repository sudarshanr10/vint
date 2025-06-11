import React , {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";



function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if(!jwt){
      navigate("/");
      return;
    }

    fetch("http://localhost:8000/transactions", {
      headers: {Authorization: `Bearer ${jwt}`},
    })
      .then(res => res.json().then(body => (res.ok ? body : Promise.reject(body))))
      .then(data => setTransactions(data))
      .catch(err => {
        console.error("Error fetching transactions:", err);
        setError(err.detail || "Failed to load transactions");
      });
  }, [navigate]);

  if (error) 
    return <p style={{ color: "red" }}>{error}</p>;
  if (transactions.length === 0) 
    return <p>No transactions found.</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Your Transactions</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Date</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Category</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "right", padding: "0.5rem" }}>Amount</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id}>
              <td>{new Date(transaction.timestamp).toLocaleDateString()}</td>
              <td>{transaction.category}</td>
              <td style={{ textAlign: "right" }}>${transaction.amount.toFixed(2)}</td>
              <td>{transaction.description || "-"}</td>
              <td>
                <button onClick={() => navigate(`/edit/${transaction.id}`)}>Edit</button>
                <button
                  onClick={async () => {
                    const jwt = localStorage.getItem("jwt");
                    await fetch(`http://localhost:8000/transactions/${transaction.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${jwt}` }
                    });
                    setTransactions(curr => curr.filter(t => t.id !== transaction.id));
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default TransactionsPage;