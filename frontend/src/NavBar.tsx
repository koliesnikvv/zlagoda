import React from "react";
import { getUserRoleLabel } from "./utils/getUserRole";
import { useUserStore } from "./store";

function NavBar(): React.JSX.Element {
  const { user, onLogout } = useUserStore();
  return (
    <nav
      style={{
        background: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        padding: "15px 0",
        marginBottom: "30px",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <h2 style={{ color: "#c1680e" }}>ZLAGODA</h2>
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <span>
            {user?.empl_name} {user?.empl_surname} (
            {getUserRoleLabel(user?.empl_role)})
          </span>
          <span style={{ fontSize: "12px", color: "#666" }}>{user?.email}</span>
          <button className="btn btn-danger" onClick={onLogout}>
            Вийти
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
