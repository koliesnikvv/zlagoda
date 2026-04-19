import React from "react";
import { useUserStore } from "./store/user";

function Profile(): React.JSX.Element {
  const { user } = useUserStore();

  if (!user) {
    return (
      <div className="card">
        <p style={{ padding: 20 }}>Інформація про користувача недоступна</p>
      </div>
    );
  }

  const fullName =
    `${user.empl_surname} ${user.empl_name}` +
    (user.empl_patronymic ? ` ${user.empl_patronymic}` : "");
  const roleLabel = user.empl_role === "Manager" ? "Менеджер" : "Касир";
  const address =
    [user.city, user.street, user.zip_code].filter(Boolean).join(", ") || "—";

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #eee",
  };
  const labelStyle: React.CSSProperties = {
    color: "#666",
    fontWeight: 500,
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Мій профіль</h2>
      </div>

      <div
        style={{
          padding: 16,
          background: "#f9f9f9",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginBottom: 4 }}>{fullName}</h3>
        <div style={{ color: "#666" }}>
          {roleLabel} · ID <code>{user.id_employee}</code>
        </div>
      </div>

      <h3 style={{ marginBottom: 8 }}>Особисті дані</h3>
      <div style={rowStyle}>
        <div style={labelStyle}>Прізвище</div>
        <div>{user.empl_surname}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Ім'я</div>
        <div>{user.empl_name}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>По батькові</div>
        <div>{user.empl_patronymic || "—"}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Дата народження</div>
        <div>{user.date_of_birth}</div>
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Робота</h3>
      <div style={rowStyle}>
        <div style={labelStyle}>Роль</div>
        <div>{roleLabel}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Зарплата</div>
        <div>{Number(user.salary).toFixed(2)} грн</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Дата початку роботи</div>
        <div>{user.date_of_start}</div>
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Контакти</h3>
      <div style={rowStyle}>
        <div style={labelStyle}>Email</div>
        <div>{user.email}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Телефон</div>
        <div>{user.phone_number}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Адреса</div>
        <div>{address}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Місто</div>
        <div>{user.city || "—"}</div>
      </div>
      <div style={rowStyle}>
        <div style={labelStyle}>Вулиця</div>
        <div>{user.street || "—"}</div>
      </div>
      <div style={{ ...rowStyle, borderBottom: "none" }}>
        <div style={labelStyle}>Поштовий індекс</div>
        <div>{user.zip_code || "—"}</div>
      </div>
    </div>
  );
}

export default Profile;
