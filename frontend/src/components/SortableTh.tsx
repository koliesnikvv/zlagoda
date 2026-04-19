import React from 'react'

export type SortOrder = 'ASC' | 'DESC' | null

export type SortState = {
  sort: string | null
  order: SortOrder
}

export function nextSort(current: SortState, field: string): SortState {
  if (current.sort !== field) return { sort: field, order: 'ASC' }
  if (current.order === 'ASC') return { sort: field, order: 'DESC' }
  if (current.order === 'DESC') return { sort: null, order: null }
  return { sort: field, order: 'ASC' }
}

type Props = {
  field: string
  state: SortState
  onToggle: (field: string) => void
  children: React.ReactNode
}

export function SortableTh({ field, state, onToggle, children }: Props): React.JSX.Element {
  const active = state.sort === field
  const arrow = !active ? '↕' : state.order === 'ASC' ? '▲' : '▼'
  return (
    <th
      onClick={() => onToggle(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      title="Натисніть для сортування"
    >
      {children} <span style={{ opacity: active ? 1 : 0.4, fontSize: 12 }}>{arrow}</span>
    </th>
  )
}
