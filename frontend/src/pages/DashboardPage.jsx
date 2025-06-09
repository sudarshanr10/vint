import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend} from "recharts";

function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt")
    if(!jwt)
    {
      navigate("/");
      return;
    }

   fetch("http://localhost:8000/transactions/summary", {
    headers: {Authorization: `Bearer ${jwt}`}
  })
    .then(res =>
      res.json().then(body => (res.ok ? body : Promise.reject(body))))
    .then(summary => {
      const chartData = Object.entries(summary).map(([category, total]) => ({category,total}));
      setData(chartData);
    })
    .catch(err => {
      console.error("Error fetching summary:", err);
      setError(err.detail || "Failed to load summary data");
    });
}, [navigate]);

return (
    <div style={{ padding: "2rem" }}>
      <h1>Your Spending This Month</h1>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip formatter={value => `$${value.toFixed(2)}`} />
          <Bar dataKey="total" name="Amount Spent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardPage;