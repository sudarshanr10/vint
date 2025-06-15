import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import NavBar from "../components/NavBar";
import { CATEGORY_COLORS, getColorForCategory } from "../utils/colors";

// Custom Tooltip to show only hovered category
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { category, total } = payload[0].payload;
    return (
      <div style={{
        background: "#101a2c",
        border: "1px solid #2de1a3",
        borderRadius: 12,
        color: "#fff",
        padding: "12px 16px"
      }}>
        <div style={{ fontWeight: 700, color: "#2de1a3" }}>{category}</div>
        <div style={{ fontWeight: 600 }}>{`$${Number(total).toFixed(2)}`}</div>
      </div>
    );
  }
  return null;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/");
      return;
    }

    fetch("http://localhost:8000/transactions/summary", {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((res) =>
        res.json().then((body) => (res.ok ? body : Promise.reject(body))))
      .then((summary) => {
        const chartData = Object.entries(summary).map(([category, total]) => ({category,total,}));
        setData(chartData);
      })
      .catch((err) => {
        console.error("Error fetching summary:", err);
        setError(err.detail || "Failed to load summary data");
      });
  }, [navigate]);

  const renderBars = () =>
  data.map((entry) => (
    <Bar
      key={entry.category}
     dataKey="total"
      name={entry.category}
      data={[entry]}
      fill={getColorForCategory(entry.category)}
      radius={[8, 8, 0, 0]}
      barSize={48}
      isAnimationActive={true}
    />
  ));

  return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-10">
        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight drop-shadow">Your Spending This Month</h1>
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          {error && (
            <div className="text-red-400 mb-4 font-semibold">{error}</div>
          )}
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={data}
              margin={{ top: 32, right: 32, left: 0, bottom: 32 }}
              barGap={8}
            >
              <CartesianGrid stroke="#2de1a355" strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={false}
                axisLine={{ stroke: "#2de1a3" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#b5c9e2", fontWeight: 600, fontSize: 14 }}
                axisLine={{ stroke: "#2de1a3" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
                iconType="circle"
                align="center"
                verticalAlign="top"
              />
              {renderBars()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
