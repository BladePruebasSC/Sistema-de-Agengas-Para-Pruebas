import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdminPage from './pages/AdminPage';
import { AppointmentProvider } from './context/AppointmentContext';

function App() {
  return (
    <AppointmentProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-100">
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BookingPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          
          <footer className="bg-gray-900 text-white py-6">
            <div className="container mx-auto px-4">
              <div className="mt-6 border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Gaston Stylo Barber Shop. Todos los derechos reservados.
              </div>
            </div>
          </footer>
        </div>
        
        <Toaster position="top-right" />
      </Router>
    </AppointmentProvider>
  );
}

export default App;