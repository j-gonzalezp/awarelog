import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../features/authentication/services/authService';

const Navbar: React.FC = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    console.log('[Navbar] Attempting logout...');
    const { error } = await signOutUser();
    if (error) {
      console.error('[Navbar] Logout error:', error);
    } else {
      console.log('[Navbar] Logout successful.');


    }
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              App Base
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-primary hover:bg-accent'
                }`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-primary hover:bg-accent'
                }`
              }
            >
              Acerca de
            </NavLink>
            <NavLink
              to="/conciencia"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-primary hover:bg-accent'
                }`
              }
            >
              Conciencia
            </NavLink>
          </div>
          <div className="flex items-center">
            {user && (
              <span className="text-sm text-muted-foreground mr-3 hidden sm:inline">
                {user.email}
              </span>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;