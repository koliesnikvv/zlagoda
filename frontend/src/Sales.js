import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function Sales({ token, userRole }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {loadProducts(); loadSales();}, []);

  const loadProducts = async () => {
    const res = await fetch('http://127.0.0.1:8000/products');
    const data = await res.json();
    setProducts(data);
  };

  const loadSales = async () => {
    const res = await fetch('http://127.0.0.1:8000/sales', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    setSales(data);
  };

  const handleSale = async () => {
    if (!selectedProduct) {
      toast.error('Виберіть товар');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProduct));

    if (quantity > product.stock) {
      toast.error(`Недостатньо товару! Є лише ${product.stock} шт`);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: parseInt(selectedProduct),
          quantity: quantity
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Продаж виконано! Сума: ${data.total} грн`);
        loadProducts();
        loadSales();
        setSelectedProduct('');
        setQuantity(1);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Помилка продажу');
      }
    } catch (error) {
      toast.error('Помилка з\'єднання');
    }
  };

  return (
    <>
      {(userRole === 'cashier' || userRole === 'admin') && (
        <div className="card">
          <div className="card-header">
            <h2>Каса</h2>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Товар</label>
              <select
                className="form-control"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Виберіть товар...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.price} грн (в наявності: {p.stock} шт)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Кількість</label>
              <input
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
              />
            </div>
            <button className="btn btn-success" onClick={handleSale}>
              Продати
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Історія продажів</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Касир</th>
                <th>Товар</th>
                <th>Кількість</th>
                <th>Сума</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{sale.cashier}</td>
                  <td>{sale.product}</td>
                  <td>{sale.quantity}</td>
                  <td>{sale.total} грн</td>
                  <td>{new Date(sale.date).toLocaleString('uk-UA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Sales;