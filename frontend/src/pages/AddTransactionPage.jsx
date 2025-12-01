import React , {useState} from "react";
import {useNavigate} from "react-router-dom";
import NavBar from "../components/NavBar";

function AddTransactionPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState(["Bills","Debt Payments","Entertainment","Fees","Food","Government","Health","Home","Income","Shopping","Transfers","Transportation", "Other"]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");

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
    const selectedCategory = showNewCategoryInput ? newCategory : category;
    const response = await fetch("http://localhost:8000/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        category: selectedCategory,
        description: description || undefined
      })
    });

    const data = await response.json();
    if(!response.ok)
    {
      throw new Error(data.detail || "Failed to add transaction");
    }
    navigate("/transactions");
  }catch(err){
    console.error("Error adding transaction:", err);
    setError(err.message);
  }finally{
    setLoading(false);
  }
};

return (
  <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
    <NavBar />
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight drop-shadow">Add Transaction</h1>
      <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
        {error && <div className="text-red-400 mb-4 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[#2de1a3] font-semibold mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-[#101a2c] text-white border border-[#2de1a3]/30 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
            />
          </div>
          <div>
            <label className="block text-[#2de1a3] font-semibold mb-2">Category</label>
            {showNewCategoryInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#101a2c] text-white border border-[#2de1a3]/30 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategory && !categories.includes(newCategory)) {
                      setCategories(prev => [...prev, newCategory]);
                    }
                    setCategory(newCategory);
                    setShowNewCategoryInput(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold hover:bg-[#1ed7a0] transition"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "add-new") {
                    setShowNewCategoryInput(true);
                    setNewCategory("");
                  } else {
                    setCategory(val);
                  }
                }}
                required
                className="w-full px-4 py-2 rounded-lg bg-[#101a2c] text-white border border-[#2de1a3]/30 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
              >
                <option value="" disabled>
                  -- Select Category --
                </option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="add-new">➕ Add new category</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-[#2de1a3] font-semibold mb-2">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#101a2c] text-white border border-[#2de1a3]/30 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-6 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-bold text-lg shadow hover:bg-[#1ed7a0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
          >
            {loading ? "Saving…" : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  </div>
);
}

export default AddTransactionPage;