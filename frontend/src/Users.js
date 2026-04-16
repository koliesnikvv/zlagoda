import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { getUserRoleLabel } from "./utils/getUserRole";
import { ChangeUserModal } from "./components/ChangeUserModal";

const userDefaultData = {
  empl_surname: "",
  empl_name: "",
  empl_patronymic: "",
  empl_salary: 0,
  password: "",
  empl_role: "Cashier",
  city: "",
  street: "",
  zip_code: "",
  date_of_birth: "",
  phone_number: "",
};

function Users({ token }) {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(userDefaultData);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Помилка завантаження користувачів");
    }
  };

  const onEditUser = (user) => {
    setEditingUser({
      id_employee: user.id_employee,
      empl_surname: user.empl_surname,
      empl_name: user.empl_name,
      empl_patronymic: user.empl_patronymic,
      empl_salary: user.salary,
      empl_role: user.empl_role,
      city: user.city,
      email: user.email,
      street: user.street,
      zip_code: user.zip_code,
      date_of_birth: user.date_of_birth,
      phone_number: user.phone_number,
    });
    setModalEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        date_of_start: new Date().toISOString().split("T")[0],
      };
      console.log("Submitting user data:", data);
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Користувача додано");
        loadUsers();
        closeModal();
      } else {
        toast.error("Помилка створення");
      }
    } catch (error) {
      toast.error("Помилка з'єднання");
    }
  };

  const handleDelete = async (id_employee) => {
    if (window.confirm("Ви впевнені?")) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/users/${id_employee}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          toast.success("Користувача видалено");
          loadUsers();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail || "Помилка видалення");
        }
      } catch (error) {
        toast.error("Помилка з'єднання");
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData(userDefaultData);
  };

  const renderItem = (user) => {
    return (
      <tr key={user.id_employee}>
        <td>{user.id_employee}</td>
        <td>
          {user.empl_name} {user.empl_surname}
        </td>
        <td>{user.email}</td>
        <td>{getUserRoleLabel(user.empl_role)}</td>
        <td>{new Date(user.date_of_start).toLocaleDateString("uk-UA")}</td>
        <td>
          <button
            className="btn btn-danger"
            onClick={() => handleDelete(user.id_employee)}
          >
            Видалити
          </button>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onEditUser(user)}
          >
            Редагувати
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Управління користувачами</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Додати користувача
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ім'я</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Дата реєстрації</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>{users.map(renderItem)}</tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Додати користувача</h3>
              <span className="close" onClick={closeModal}>
                &times;
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ім'я *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.empl_name}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Прізвище *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.empl_surname}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_surname: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>По батькові *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.empl_patronymic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      empl_patronymic: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль *</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Роль *</label>
                <select
                  className="form-control"
                  value={formData.empl_role}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_role: e.target.value })
                  }
                >
                  <option value="Cashier">Касир</option>
                  <option value="Manager">Менеджер</option>
                </select>
              </div>
              <div className="form-group">
                <label>Зарплата *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.empl_salary}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_salary: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Дата народження *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Номер телефону *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Місто *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Вулиця *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Поштовий індекс *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.zip_code}
                  onChange={(e) =>
                    setFormData({ ...formData, zip_code: e.target.value })
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  Додати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalEditOpen && (
        <ChangeUserModal
          user={editingUser}
          onClose={() => setModalEditOpen(false)}
          loadUsers={loadUsers}
          token={token}
        />
      )}
    </div>
  );
}

export default Users;
