import { useState } from "react";
import { toast } from "react-toastify";

export const ChangeUserModal = ({ user, onClose, loadUsers, token }) => {
  const [formData, setFormData] = useState(user);

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
      };
      console.log("Submitting user data:", data);
      const res = await fetch(
        `http://127.0.0.1:8000/users/${data.id_employee}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
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
          }),
        },
      );

      if (res.ok) {
        toast.success("Користувача оновлено");
        loadUsers();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Помилка оновлення");
      }
    } catch (error) {
      console.error("Error submitting user data:", error);
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
              defaultValue={user.empl_name}
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
              defaultValue={user.empl_surname}
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
              defaultValue={user.empl_patronymic}
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
              defaultValue={user.email}
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
              defaultValue={user.empl_role}
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
              defaultValue={user.empl_salary}
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
              defaultValue={user.date_of_birth}
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
              defaultValue={user.phone_number}
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
              defaultValue={user.city}
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
              defaultValue={user.street}
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
              defaultValue={user.zip_code}
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
              onClick={onClose}
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
  );
};
