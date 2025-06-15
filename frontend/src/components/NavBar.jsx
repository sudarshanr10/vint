import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { name: "Dashboard", to: "/dashboard" },
  { name: "Transactions", to: "/transactions" },
];

function NavBar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/");
  };

  return (
    <nav className="w-[90vw] max-w-6xl mx-auto mt-8 rounded-2xl bg-[#101a2c]/80 backdrop-blur-md border border-[#2de1a3]/30 shadow-xl px-4 py-2 flex items-center justify-between z-30">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-extrabold text-[#2de1a3] tracking-tight select-none">vint.</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 ` +
              (isActive
                ? "bg-[#2de1a3] text-[#101a2c] shadow scale-105 ring-2 ring-[#2de1a3]/60"
                : "text-white hover:bg-[#2de1a3]/20 hover:text-[#2de1a3]")
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-px bg-[#2de1a3]/30 mx-2" />
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg font-semibold text-base bg-[#2de1a3] text-[#101a2c] hover:bg-[#1ed7a0] transition-colors duration-200 shadow"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default NavBar; 