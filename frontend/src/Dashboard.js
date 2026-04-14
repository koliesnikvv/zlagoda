import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './NavBar';
import Products from './Products';
import Reports from './Reports';
import Users from './Users';
import Cashier from './Cashier';

function Dashboard({ token, user, onLogout }) {
  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="container">
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Товари</Link>

          {(user?.role === 'cashier' || user?.role === 'admin') && (
            <Link to="/cashier" className="btn btn-success">Каса</Link>
          )}

          <Link to="/reports" className="btn btn-primary">Звіти</Link>

          {user?.role === 'admin' && (
            <Link to="/users" className="btn btn-primary">Користувачі</Link>
          )}
        </div>

        <Routes>
          <Route path="/" element={<Products token={token} userRole={user?.role} />} />
          <Route path="/cashier" element={<Cashier token={token} />} />
          <Route path="/reports" element={<Reports token={token} />} />
          <Route path="/users" element={<Users token={token} />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;