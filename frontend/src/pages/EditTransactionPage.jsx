import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";

function EditTransactionPage()
{
    const {id} = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState({amount: "", category: "", description: ""});
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState(["Bills","Debt Payments","Entertainment","Fees","Food","Government","Health","Home","Income","Shopping","Transfers","Transportation", "Other"]);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if(!jwt)
        {
            navigate("/");
            return;
        }
        const API = process.env.REACT_APP_API_BASE_URL;
        fetch(`${API}/transactions`, {
            headers: { Authorization: `Bearer ${jwt}` }
        })
        .then(response => response.json())
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
            if(transaction.category && !categories.includes(transaction.category))
            {
              setCategories(prev => [...prev, transaction.category]);
            }
        })
        .catch(() => navigate("/transactions")).finally(() => setLoading(false));
    }, [id, navigate, categories]);

      const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        const jwt = localStorage.getItem("jwt");
        const selectedCategory = showNewCategoryInput? newCategory : form.category;
        try {
          const API = process.env.REACT_APP_API_BASE_URL;
          await fetch(`${API}/transactions/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt}`
            },
            body: JSON.stringify({
              amount: parseFloat(form.amount),
              category: selectedCategory,
              description: form.description || undefined
            })
          });
          navigate("/transactions");
        } catch (err) {
          setError("Failed to save changes");
        }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 flex items-center justify-center">
          <span className="text-[#2de1a3] text-lg font-semibold">Loading…</span>
        </div>
      </div>
    </div>
  );

 return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-xl mx-auto mt-10">
        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight drop-shadow">Edit Transaction</h1>
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          {error && <div className="text-red-400 mb-4 font-semibold">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-[#2de1a3] font-semibold mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e =>
                  setForm(prev => ({ ...prev, amount: e.target.value }))
                }
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
                      setForm(prev => ({ ...prev, category: newCategory }));
                      setShowNewCategoryInput(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-semibold hover:bg-[#1ed7a0] transition"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={form.category}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "add-new") {
                      setShowNewCategoryInput(true);
                      setNewCategory("");
                    } else {
                      setForm(prev => ({ ...prev, category: val }));
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
                value={form.description}
                onChange={e =>
                  setForm(prev => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg bg-[#101a2c] text-white border border-[#2de1a3]/30 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 rounded-lg bg-[#2de1a3] text-[#101a2c] font-bold text-lg shadow hover:bg-[#1ed7a0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditTransactionPage; 