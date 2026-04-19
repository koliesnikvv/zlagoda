import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { isAxiosError } from 'axios'
import { TUser } from '../types'
import { UsersService } from '../services'
import { getUserRoleLabel } from '../utils/getUserRole'
import { TUserContact } from '../services/users/types'

type Props = {
  user: TUser
  onEdit: (user: TUser) => void
  onDelete: (id_employee: number) => void
}

export function UserRow({ user, onEdit, onDelete }: Props): React.JSX.Element {
  const [contactOpen, setContactOpen] = useState<boolean>(false)
  const [contact, setContact] = useState<TUserContact | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const showContact = async () => {
    setContactOpen(true)
    setLoading(true)
    try {
      const res = await UsersService.getUserContact(user.id_employee)
      setContact(res.data)
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || 'Не вдалося завантажити контакти')
      } else {
        toast.error("Помилка з'єднання")
      }
      setContactOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const closeContact = () => {
    setContactOpen(false)
    setContact(null)
  }

  const fullName =
    `${user.empl_surname} ${user.empl_name}` +
    (user.empl_patronymic ? ` ${user.empl_patronymic}` : '')

  return (
    <>
      <tr>
        <td>{user.id_employee}</td>
        <td>
          {user.empl_name} {user.empl_surname}
        </td>
        <td>{user.email}</td>
        <td>{getUserRoleLabel(user.empl_role)}</td>
        <td>{new Date(user.date_of_start).toLocaleDateString('uk-UA')}</td>
        <td>
          <button className="btn btn-info btn-sm" onClick={showContact}>
            Контакти
          </button>
          <button
            className="btn btn-warning btn-sm"
            style={{ marginLeft: '5px' }}
            onClick={() => onEdit(user)}
          >
            Редагувати
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: '5px' }}
            onClick={() => onDelete(user.id_employee)}
          >
            Видалити
          </button>
        </td>
      </tr>

      {contactOpen && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div className="modal" onClick={closeContact}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Контактні дані</h3>
                  <span className="close" onClick={closeContact}>
                    &times;
                  </span>
                </div>

                <div style={{ padding: '8px 0' }}>
                  <p style={{ marginBottom: 12 }}>
                    <strong>Працівник (за прізвищем):</strong> {fullName}
                  </p>

                  {loading ? (
                    <p>Завантаження…</p>
                  ) : contact ? (
                    <div style={{ lineHeight: 1.8 }}>
                      <div>
                        <strong>Телефон:</strong>{' '}
                        <a href={`tel:${contact.phone_number}`}>{contact.phone_number}</a>
                      </div>
                      <div>
                        <strong>Місто:</strong> {contact.city}
                      </div>
                      <div>
                        <strong>Вулиця:</strong> {contact.street}
                      </div>
                      <div>
                        <strong>Поштовий індекс:</strong> {contact.zip_code}
                      </div>
                    </div>
                  ) : (
                    <p>Немає даних</p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={closeContact}>
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
