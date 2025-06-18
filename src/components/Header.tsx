import React from 'react';
import { Scissors, Calendar, User, Settings, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppointments } from '../context/AppointmentContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { adminSettings } = useAppointments();
  
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Scissors className="h-8 w-8 text-red-500 mr-2" />
            <h1 className="text-2xl font-bold">Gaston Stylo</h1>
          </div>
          
          <nav className="flex space-x-1 sm:space-x-4">
            <NavLink to="/" current={location.pathname === "/"}>
              <Calendar className="h-5 w-5 mr-1" />
              <span>Agendar</span>
            </NavLink>
            
            <NavLink to="/appointments" current={location.pathname === "/appointments"}>
              <User className="h-5 w-5 mr-1" />
              <span>Mis Citas</span>
            </NavLink>
            
            {/* Solo mostrar reseñas si están habilitadas */}
            {adminSettings.reviews_enabled !== false && (
              <NavLink to="/reviews" current={location.pathname === "/reviews"}>
                <Star className="h-5 w-5 mr-1" />
                <span>Reseñas</span>
              </NavLink>
            )}
            
            <NavLink to="/admin" current={location.pathname.startsWith("/admin")}>
              <Settings className="h-5 w-5 mr-1" />
              <span>Admin</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  current: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, current, children }) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        current
          ? 'bg-red-700 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
};

export default Header;