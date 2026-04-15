import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function Users({ token }) {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '', role: 'cashier' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Помилка завантаження користувачів');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Користувача додано');
        loadUsers();
        closeModal();
      } else {
        toast.error('Помилка створення');
      }
    } catch (error) {
      toast.error('Помилка з\'єднання');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ви впевнені?')) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          toast.success('Користувача видалено');
          loadUsers();
        }
      } catch (error) {
        toast.error('Помилка видалення');
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData({ email: '', full_name: '', password: '', role: 'cashier' });
  };

  const getRoleLabel = (role) => {
    const roles = {
      'manager': 'Менеджер',
      'cashier': 'Касир'
    };
    return roles[role] || role;
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
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{getRoleLabel(user.role)}</td>
                <td>{new Date(user.created_at).toLocaleDateString('uk-UA')}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(user.id)}
                  >
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Додати користувача</h3>
              <span className="close" onClick={closeModal}>&times;</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ПІБ *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль *</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Роль *</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="cashier">Касир</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Адміністратор</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
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
    </div>
  );
}

export default Users;