import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { CartItem } from './types'
import { useProductStore } from './store/product'
import { CustomerCardsService, SalesService, TCustomerCard } from './services'
import { isAxiosError } from 'axios'

function Cashier(): React.JSX.Element {
  const { storeProducts: products, loadStore } = useProductStore()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [cards, setCards] = useState<TCustomerCard[]>([])
  const [selectedCard, setSelectedCard] = useState<string>('')

  useEffect(() => {
    loadStore()
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const res = await CustomerCardsService.getCards()
      setCards(res.data)
    } catch (e) {
      console.error('[Cashier]: loadCards error:', e)
    }
  }

  const selectedCardObj = cards.find(c => c.card_number === selectedCard) || null
  const discountPercent = selectedCardObj?.percent ?? 0

  const addToCart = (): void => {
    if (!selectedProduct) {
      toast.error('Виберіть товар')
      return
    }

    const product = products.find(p => p.upc === selectedProduct)
    if (!product) return

    if (quantity > product.stock) {
      toast.error(`Недостатньо товару! Є лише ${product.stock} шт`)
      return
    }

    const existingItem = cart.find(item => item.upc === product.upc)

    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        toast.error(`Недостатньо товару! Є лише ${product.stock} шт`)
        return
      }
      setCart(
        cart.map(item =>
          item.upc === product.upc ? { ...item, quantity: item.quantity + quantity } : item,
        ),
      )
    } else {
      setCart([...cart, { ...product, quantity }])
    }

    setSelectedProduct('')
    setQuantity(1)
    toast.success('Товар додано до кошика')
  }

  const removeFromCart = (upc: string): void => {
    setCart(cart.filter(item => item.upc !== upc))
  }

  const updateQuantity = (upc: string, newQuantity: number): void => {
    const product = products.find(p => p.upc === upc)
    if (!product) return

    if (newQuantity > product.stock) {
      toast.error(`Недостатньо товару! Є лише ${product.stock} шт`)
      return
    }

    if (newQuantity <= 0) {
      removeFromCart(upc)
    } else {
      setCart(cart.map(item => (item.upc === upc ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const processSale = async (): Promise<void> => {
    if (cart.length === 0) {
      toast.error('Кошик порожній')
      return
    }

    try {
      const response = await SalesService.postSale({
        card_number: selectedCard || null,
        items: cart.map(item => ({ UPC: item.upc, product_number: item.quantity })),
      })

      toast.success(`Продано! Сума: ${response.data.total.toFixed(2)} грн`)
      setCart([])
      setSelectedCard('')
      loadStore()
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || 'Помилка продажу')
        return
      }
      toast.error('Помилка продажу')
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = (subtotal * discountPercent) / 100
  const totalAmount = subtotal - discountAmount

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
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">Оберіть товар</option>
              {products.map(p => (
                <option key={p.upc} value={p.upc}>
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
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
          <button className="btn btn-primary" onClick={addToCart} style={{ marginTop: '28px' }}>
            Додати
          </button>
        </div>

        <div className="form-group">
          <label>Картка клієнта (необов'язково)</label>
          <select
            className="form-control"
            value={selectedCard}
            onChange={e => setSelectedCard(e.target.value)}
          >
            <option value="">Без картки</option>
            {cards.map(c => (
              <option key={c.card_number} value={c.card_number}>
                {c.card_number} — {c.cust_surname} {c.cust_name} (-{c.percent}%)
              </option>
            ))}
          </select>
          {selectedCardObj && (
            <small style={{ color: '#3b82f6' }}>
              Знижка {discountPercent}% буде застосована до суми чека
            </small>
          )}
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
                  {cart.map(item => (
                    <tr key={item.upc}>
                      <td>{item.name}</td>
                      <td>{item.price.toFixed(2)} грн</td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.upc, parseInt(e.target.value) || 0)}
                          min="1"
                          style={{ width: '70px', padding: '5px' }}
                        />
                      </td>
                      <td>{(item.price * item.quantity).toFixed(2)} грн</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => removeFromCart(item.upc)}
                          style={{ padding: '5px 10px' }}
                        >
                          видалити
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right' }}>
                      Підсумок:
                    </td>
                    <td colSpan={2}>{subtotal.toFixed(2)} грн</td>
                  </tr>
                  {discountPercent > 0 && (
                    <tr style={{ color: '#3b82f6' }}>
                      <td colSpan={3} style={{ textAlign: 'right' }}>
                        Знижка ({discountPercent}%):
                      </td>
                      <td colSpan={2}>− {discountAmount.toFixed(2)} грн</td>
                    </tr>
                  )}
                  <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ textAlign: 'right' }}>
                      ВСЬОГО:
                    </td>
                    <td colSpan={2}>{totalAmount.toFixed(2)} грн</td>
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
  )
}

export default Cashier
