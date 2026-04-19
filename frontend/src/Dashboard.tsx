import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./NavBar";
import Products from "./StoreProducts";
import Catalog from "./Catalog";
import Categories from "./Categories";
import Reports from "./Reports";
import Users from "./Users";
import Cashier from "./Cashier";
import CustomerCards from "./CustomerCards";
import Profile from "./Profile";
import { useUserStore } from "./store";

function Dashboard(): React.JSX.Element {
  const { user } = useUserStore();
  const isCashier = user?.empl_role === "Cashier";
  const isManager = user?.empl_role === "Manager";

  return (
    <div>
      <Navbar />
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
            Товари на складі
          </Link>

          <Link to="/catalog" className="btn btn-primary">
            Каталог товарів
          </Link>

          <Link to="/categories" className="btn btn-primary">
            Категорії
          </Link>

          {isCashier && (
            <Link to="/cashier" className="btn btn-success">
              Каса
            </Link>
          )}

          {isCashier && (
            <Link to="/profile" className="btn btn-primary">
              Мій профіль
            </Link>
          )}

          <Link to="/reports" className="btn btn-primary">
            Звіти
          </Link>

          <Link to="/customer-cards" className="btn btn-primary">
            Постійні клієнти
          </Link>

          {isManager && (
            <Link to="/users" className="btn btn-primary">
              Користувачі
            </Link>
          )}
        </div>

        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/customer-cards" element={<CustomerCards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;
