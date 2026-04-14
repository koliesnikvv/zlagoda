import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function Cashier({ token }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

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

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Виберіть товар');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProduct));

    if (quantity > product.stock) {
      toast.error(`Недостатньо товару! Є лише ${product.stock} шт`);
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        toast.error(`Недостатньо товару! Є лише ${product.stock} шт`);
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }

    setSelectedProduct('');
    setQuantity(1);
    toast.success('Товар додано до кошика');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (newQuantity > product.stock) {
      toast.error(`Недостатньо товару! Є лише ${product.stock} шт`);
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Кошик порожній');
      return;
    }

    try {
      for (const item of cart) {
        const res = await fetch('http://127.0.0.1:8000/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: item.id,
            quantity: item.quantity
          })
        });

        if (!res.ok) {
          throw new Error(`Помилка продажу ${item.name}`);
        }
      }

      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      toast.success(`Продано! Сума: ${total.toFixed(2)} грн`);
      setCart([]);
      loadProducts();
    } catch (error) {
      toast.error('Помилка продажу');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Каса</h2>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Товар</label>
            <select
              className="form-control"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Оберіть товар</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.price.toFixed(2)} грн (в наявності: {p.stock} шт)
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
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
          <button className="btn btn-primary" onClick={addToCart} style={{ marginTop: '28px' }}>
            Додати
          </button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h2>Кошик</h2>
        </div>
        {cart.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            Кошик порожній. Додайте товари.
          </p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Ціна</th>
                    <th>Кількість</th>
                    <th>Сума</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.price.toFixed(2)} грн</td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          min="1"
                          style={{ width: '70px', padding: '5px' }}
                        />
                      </td>
                      <td>{(item.price * item.quantity).toFixed(2)} грн</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => removeFromCart(item.id)}
                          style={{ padding: '5px 10px' }}
                        >
                          видалити
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                    <td colSpan="3" style={{ textAlign: 'right' }}>ВСЬОГО:</td>
                    <td colSpan="2">{totalAmount.toFixed(2)} грн</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-success" onClick={processSale}>
               Продати
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cashier;