import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditTransactionPage()
{
    const {id} = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState({amount: "", category: "", description: ""});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if(!jwt)
        {
            navigate("/");
            return;
        }
        fetch('http://localhost:8000/transactions', {
            headers: {Authorization: `Bearer ${jwt}`}
        })
        .then(res => res.json())
        .then(list => {
            const transaction = list.find(t => t.id === +id);
            if(!transaction)
            {
                throw new Error("Not found");
            }
            setForm({
                amount: transaction.amount,
                category: transaction.category,
                description: transaction.description || ""
            });
        })
        .catch(() => navigate("/transactions")).finally(() => setLoading(false));
    }, [id, navigate]);

      const handleSubmit = async e => {
    e.preventDefault();
    const jwt = localStorage.getItem("jwt");
    await fetch(`http://localhost:8000/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description || undefined
      })
    });
    navigate("/transactions");
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Edit Transaction</h1>
      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <label>Amount</label>
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
          required
        />
        {/* Category */}
        <label>Category</label>
        <input
          type="text"
          value={form.category}
          onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
          required
        />
        {/* Description */}
        <label>Description (optional)</label>
        <input
          type="text"
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
        />
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
    export default EditTransactionPage; 