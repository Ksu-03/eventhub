import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Navbar() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            EventHub
          </Link>
          
          <div className="flex items-center gap-4">
            {token && user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Войти
                </Link>
                <Link to="/register" className="text-gray-700 hover:text-blue-600">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
