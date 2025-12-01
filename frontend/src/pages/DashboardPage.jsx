import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import NavBar from "../components/NavBar";
import { getColorForCategory } from "../utils/colors";
import PlaidLinkButton from "../components/PlaidLinkButton";

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

const fetchSummary = async (setData, setError, navigate, daysWindow) => {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    navigate("/");
    return;
  }
  let url = "http://localhost:8000/transactions/summary";
  if (typeof daysWindow === "number") {
    url += `?days=${daysWindow}`;
  }


  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const body = await response.json();
    if (!response.ok) throw body;

    const chartData = Object.entries(body)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    setData(chartData);
  } catch (err) {
    console.error("Error fetching summary:", err);
    setError(err.detail || "Failed to load summary data");
  }
};

function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [daysWindow, setDaysWindow] = useState(30);
  useEffect(() => {
    fetchSummary(setData, setError, navigate, daysWindow);
  }, [navigate, daysWindow]);

  useEffect(() => {
    const onStorageChange = (e) => {
      if (e.key === 'vint_refresh_dashboard') {
        fetchSummary(setData, setError, navigate, daysWindow); 
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [navigate, daysWindow]);

  
  return (
    <div className="min-h-screen bg-[#0a1120] pb-10 px-2 md:px-8 pt-0 m-0">
      <NavBar />
      <div className="max-w-4xl mx-auto mt-10">
        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight drop-shadow">Your Spending This Month</h1>

        {/* Add Plaid Button */}
        <div className="mb-8">
          <PlaidLinkButton />
        </div>
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          {error && (
            <div className="text-red-400 mb-4 font-semibold">{error}</div>
          )}
          <ResponsiveContainer width="100%" height={340}>
            {/* 4️⃣ Window selector */}
            <div className="flex items-center mb-6 space-x-2">
              <label className="text-white font-medium">Show last:</label>
              <select
                className="bg-[#101a2c] text-white rounded p-1"
                value={daysWindow}
                onChange={e => setDaysWindow(Number(e.target.value))}
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

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
                payload={data.map((entry) => ({
                  value: entry.category,      
                  type: "square",             
                  color: getColorForCategory(entry.category)  
                }))}
                iconType="square"           
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ marginTop: 16, flexWrap: "wrap" }}
              />
              <Bar
                dataKey="total"
                radius={[8, 8, 0, 0]}
                barSize={48}
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColorForCategory(entry.category)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
