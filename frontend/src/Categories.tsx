import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { isAxiosError } from 'axios'
import { CatalogService, Category } from './services'
import { useUserStore } from './store'
import { useProductStore } from './store/product'
import { SortableTh, SortState, nextSort } from './components/SortableTh'

function Categories(): React.JSX.Element {
  const { user } = useUserStore()
  const isManager = user?.empl_role === 'Manager'

  const { categories, catalogProducts, loadCategories, loadCatalog } = useProductStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')
  const [sortState, setSortState] = useState<SortState>({ sort: null, order: null })

  const sortParams = sortState.sort && sortState.order
    ? { sort: sortState.sort, order: sortState.order }
    : undefined

  const filtered = categories.filter(c =>
    c.category_name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    loadCategories(sortParams)
    loadCatalog()
  }, [sortState])

  const toggleSort = (field: string) => {
    setSortState(prev => nextSort(prev, field))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await CatalogService.putCategory({
          category_number: editingCategory.category_number,
          category_name: categoryName,
        })
        toast.success('Категорію оновлено')
      } else {
        await CatalogService.postCategory({ category_name: categoryName })
        toast.success('Категорію додано')
      }
      loadCategories(sortParams)
      closeModal()
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || 'Помилка збереження')
        return
      }
      toast.error('Помилка збереження')
    }
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Видалити категорію "${category.category_name}"?`)) return
    try {
      await CatalogService.deleteCategory({ category_number: category.category_number })
      toast.success('Категорію видалено')
      if (selectedCategory?.category_number === category.category_number) {
        setSelectedCategory(null)
      }
      loadCategories(sortParams)
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || 'Неможливо видалити: до категорії прив\'язані товари')
        return
      }
      toast.error('Помилка видалення')
    }
  }

  const showProducts = (category: Category) => {
    if (selectedCategory?.category_number === category.category_number) {
      setSelectedCategory(null)
      return
    }
    setSelectedCategory(category)
  }

  const categoryProducts = selectedCategory
    ? catalogProducts
        .filter(p => p.category_number === selectedCategory.category_number)
        .sort((a, b) => a.product_name.localeCompare(b.product_name))
    : []

  const openAddModal = () => {
    setEditingCategory(null)
    setCategoryName('')
    setModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.category_name)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCategory(null)
    setCategoryName('')
  }

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Звіт: Категорії товарів</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
            th { background: #f0f0f0; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Звіт: Категорії товарів</h1>
          <table>
            <thead>
              <tr><th>#</th><th>Назва категорії</th></tr>
            </thead>
            <tbody>
              ${categories.map((c, i) => `<tr><td>${i + 1}</td><td>${c.category_name}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="footer">Дата формування: ${new Date().toLocaleDateString('uk-UA')}</div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(printContent)
    win.document.close()
    win.print()
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Категорії товарів</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              Друк звіту
            </button>
            {isManager && (
              <button className="btn btn-primary" onClick={openAddModal}>
                Додати категорію
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Пошук за назвою категорії..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <SortableTh field="number" state={sortState} onToggle={toggleSort}>#</SortableTh>
                <SortableTh field="name" state={sortState} onToggle={toggleSort}>Назва категорії</SortableTh>
                <th>Товари</th>
                {isManager && <th>Дії</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <React.Fragment key={c.category_number}>
                  <tr
                    style={
                      selectedCategory?.category_number === c.category_number
                        ? { backgroundColor: '#eef4ff' }
                        : {}
                    }
                  >
                    <td>{i + 1}</td>
                    <td>{c.category_name}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => showProducts(c)}
                      >
                        {selectedCategory?.category_number === c.category_number
                          ? 'Сховати'
                          : 'Показати товари'}
                      </button>
                    </td>
                    {isManager && (
                      <td>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => openEditModal(c)}
                        >
                          Редагувати
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(c)}
                          style={{ marginLeft: '5px' }}
                        >
                          Видалити
                        </button>
                      </td>
                    )}
                  </tr>

                  {selectedCategory?.category_number === c.category_number && (
                    <tr>
                      <td colSpan={isManager ? 4 : 3} style={{ padding: 0 }}>
                        <div style={{ backgroundColor: '#f8f9ff', padding: '12px 24px' }}>
                          {categoryProducts.length === 0 ? (
                            <p style={{ color: '#999' }}>У цій категорії немає товарів</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Назва</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Виробник</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Характеристики</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryProducts.map(p => (
                                  <tr key={p.id_product} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '6px 8px' }}>{p.product_name}</td>
                                    <td style={{ padding: '6px 8px' }}>{p.manufacturer}</td>
                                    <td style={{ padding: '6px 8px' }}>{p.characteristics}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 4 : 3} style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                    Категорій ще немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingCategory ? 'Редагувати категорію' : 'Нова категорія'}</h3>
            <div style={{ marginBottom: 12 }} />
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Назва категорії</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={50}
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
