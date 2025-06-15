import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddTransactionPage from "./pages/AddTransactionPage";
import TransactionsPage from "./pages/TransactionsPage";
import EditTransactionPage from "./pages/EditTransactionPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/add-transaction" element={<AddTransactionPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/edit/:id" element={<EditTransactionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
