import React , {useState} from "react";
import {useNavigate} from "react-router-dom";

function AddTransactionPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

const handleSubmit = async(e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  const jwt = localStorage.getItem("jwt");
  if(!jwt){
    navigate("/");
    return;
  }

  try{
    const res = await fetch("http://localhost:8000/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify({amount: parseFloat(amount), category, description: description || undefined})
    });
    const data = await res.json();
    if(!res.ok)
    {
      throw new Error(data.detail || "Failed to add transaction");
    }
    navigate("/dashboard");
  }catch(err){
    console.error("Error adding transaction:", err);
    setError(err.message);
  }finally{
    setLoading(false);
  }
};

return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Add Transaction</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
        >
          {loading ? "Saving…" : "Add Transaction"}
        </button>
      </form>
    </div>
  );
}

export default AddTransactionPage;