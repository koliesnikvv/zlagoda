import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function StoreProducts({ token, userRole }) {
  const [storeProducts, setStoreProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);


  const [formData, setFormData] = useState({
    upc: '',
    id_product: '',
    price: '',
    quantity: '',
    is_promo: false
  });

  useEffect(() => { loadStoreProducts(); }, []);

  const loadStoreProducts = async () => {
    try {

      const res = await fetch('http://127.0.0.1:8000/products');
      const data = await res.json();
      setStoreProducts(data);
    } catch (error) {
      toast.error('Помилка завантаження товарів на складі');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    const url = editingProduct
      ? `http://127.0.0.1:8000/store-products/${editingProduct.upc}`
      : 'http://127.0.0.1:8000/store-products';

    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          UPC: formData.upc,
          id_product: parseInt(formData.id_product),
          selling_price: parseFloat(formData.price),
          products_number: parseInt(formData.quantity),
          promotional_product: formData.is_promo
        })
      });

      if (res.ok) {
        toast.success(editingProduct ? 'Дані оновлено (переоцінка)' : 'Товар додано на склад');
        loadStoreProducts();
        closeModal();
      } else {
        const errData = await res.json();
        toast.error(errData.detail || 'Помилка збереження');
      }
    } catch (error) {
      toast.error('Помилка з\'єднання з сервером');
    }
  };

  const handleDelete = async (upc) => {
    if (window.confirm(`Видалити товар з UPC ${upc} зі складу?`)) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/store-products/${upc}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          toast.success('Товар вилучено зі складу');
          loadStoreProducts();
        }
      } catch (error) {
        toast.error('Помилка видалення');
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      upc: product.upc,
      id_product: product.id_product || '',
      price: product.price,
      quantity: product.stock,
      is_promo: product.is_promo
    });
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ upc: '', id_product: '', price: '', quantity: '', is_promo: false });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Товари на складі (ZLAGODA)</h2>
        {userRole === 'Manager' && (
          <button className="btn btn-primary" onClick={openAddModal}>
            Додати на склад
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>UPC </th>
              <th>Назва</th>
              <th>Ціна (з ПДВ) </th>
              <th>Кількість </th>
              <th>Статус</th>
              {userRole === 'Manager' && <th>Дії</th>}
            </tr>
          </thead>
          <tbody>
            {storeProducts.map((p) => (
              <tr key={p.upc} style={p.is_promo ? { backgroundColor: '#fff4f4' } : {}}>
                <td><code>{p.upc}</code></td>
                <td>{p.name}</td>
                <td>{p.price} ₴</td>
                <td>{p.stock} шт</td>
                <td>
                  {p.is_promo ?
                    <span className="badge badge-danger">Акційний </span> :
                    <span className="badge badge-success">Звичайний</span>
                  }
                </td>
                {userRole === 'Manager' && (
                  <td>
                    <button className="btn btn-warning btn-sm" onClick={() => openEditModal(p)}>Редагувати</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.upc)} style={{marginLeft: '5px'}}>Видалити</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Переоцінка / Редагування' : 'Додати товар на склад'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>UPC</label>
                <input
                  type="text"
                  maxLength="12"
                  disabled={!!editingProduct}
                  className="form-control"
                  value={formData.upc}
                  onChange={(e) => setFormData({...formData, upc: e.target.value})}
                  required
                />
              </div>
              {!editingProduct && (
                <div className="form-group">
                  <label>ID Товару з каталогу</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.id_product}
                    onChange={(e) => setFormData({...formData, id_product: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Ціна продажу (грн)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
                <small>Включаючи ПДВ 20% </small>
              </div>
              <div className="form-group">
                <label>Кількість одиниць </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_promo}
                    onChange={(e) => setFormData({...formData, is_promo: e.target.checked})}
                  /> Акційний товар
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Скасувати</button>
                <button type="submit" className="btn btn-primary">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreProducts;