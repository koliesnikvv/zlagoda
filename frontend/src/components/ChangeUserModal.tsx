import React, { useState } from "react";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { EditingUser } from "../types";
import { UsersService } from "../services";

interface ChangeUserModalProps {
  user: EditingUser;
  onClose: () => void;
  loadUsers: () => void;
}

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    // Already ISO-like "2000-02-20" or "2000-02-20T..."
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const ChangeUserModal = ({
  user,
  onClose,
  loadUsers,
}: ChangeUserModalProps): React.JSX.Element => {
  const [formData, setFormData] = useState<EditingUser>({
    ...user,
    date_of_birth: toDateInputValue(user.date_of_birth),
  });

  const handleEditSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    try {
      await UsersService.putUser({
        id: formData.id_employee,
        empl_surname: formData.empl_surname,
        empl_name: formData.empl_name,
        empl_patronymic: formData.empl_patronymic,
        empl_salary: formData.empl_salary,
        empl_role: formData.empl_role,
        email: formData.email,
        city: formData.city,
        street: formData.street,
        zip_code: formData.zip_code,
        date_of_birth: formData.date_of_birth,
        phone_number: formData.phone_number,
      });
      toast.success("Користувача оновлено");
      loadUsers();
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || "Помилка оновлення");
        return;
      }
      toast.error("Помилка з'єднання");
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Редагувати користувача</h3>
          <span className="close" onClick={onClose}>
            &times;
          </span>
        </div>
        <form onSubmit={handleEditSubmit}>
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
                setFormData({ ...formData, empl_patronymic: e.target.value })
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
            <label>Роль *</label>
            <select
              className="form-control"
              value={formData.empl_role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  empl_role: e.target.value as EditingUser["empl_role"],
                })
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
              value={formData.empl_salary as number}
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
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary">
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
