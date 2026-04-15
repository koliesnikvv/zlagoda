import React from 'react';
function NavBar({ user, onLogout }) {
  const getRole = (role) => {
    switch(role) {
      case 'admin': return '';
      case 'manager': return '';
      default: return '';
    }
  };

  return (
    <nav style={{
      background: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '15px 0',
      marginBottom: '30px'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <h2 style={{ color: '#c1680e' }}>ZLAGODA</h2>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>{getRole(user?.role)} {user?.full_name} ({user?.role === 'admin' ? 'Адмін' : user?.role === 'manager' ? 'Менеджер' : 'Касир'})</span>
          <span style={{ fontSize: '12px', color: '#666' }}>{user?.email}</span>
          <button className="btn btn-danger" onClick={onLogout}>Вийти</button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;