import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./NavBar";
import Products from "./StoreProducts";
import Reports from "./Reports";
import Users from "./Users";
import Cashier from "./Cashier";

function Dashboard({ token, user, onLogout }) {
  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="container">
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/" className="btn btn-primary">
            Товари
          </Link>

          {user?.empl_role === "Cashier" && (
            <Link to="/cashier" className="btn btn-success">
              Каса
            </Link>
          )}

          <Link to="/reports" className="btn btn-primary">
            Звіти
          </Link>

          {user?.empl_role === "Manager" && (
            <Link to="/users" className="btn btn-primary">
              Користувачі
            </Link>
          )}
        </div>

        <Routes>
          <Route
            path="/"
            element={<Products token={token} userRole={user?.empl_role} />}
          />
          <Route path="/cashier" element={<Cashier token={token} />} />
          <Route path="/reports" element={<Reports token={token} />} />
          <Route path="/users" element={<Users token={token} />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;
