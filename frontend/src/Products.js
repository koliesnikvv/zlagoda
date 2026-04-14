import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function Products({ token, userRole }) {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });

  useEffect(() => {loadProducts();}, []);

  const loadProducts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingProduct
      ? `http://127.0.0.1:8000/products/${editingProduct.id}`
      : 'http://127.0.0.1:8000/products';

    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (res.ok) {
        toast.success(editingProduct ? 'Товар оновлено' : 'Товар додано');
        loadProducts();
        closeModal();
      } else {
        toast.error('Помилка збереження');
      }
    } catch (error) {
      toast.error('Помилка з\'єднання');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей товар?')) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          toast.success('Товар видалено');
          loadProducts();
        }
      } catch (error) {
        toast.error('Помилка видалення');
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock
    });
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Управління товарами</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          Додати товар
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Назва товару</th>
              <th>Ціна (грн)</th>
              <th>Кількість</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.price} ₴</td>
                <td>{product.stock} шт</td>
                <td>
                  <button
                    className="btn btn-warning"
                    style={{ marginRight: '10px' }}
                    onClick={() => openEditModal(product)}>Редагувати</button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(product.id)}>Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {}
      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Редагувати товар' : 'Додати товар'}</h3>
              <span className="close" onClick={closeModal}>&times;</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Назва товару *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Введіть назву товару"
                />
              </div>
              <div className="form-group">
                <label>Ціна (грн) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Кількість *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                  placeholder="0"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Зберегти' : 'Додати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;