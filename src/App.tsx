import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdminPage from './pages/AdminPage';
import ReviewsPage from './pages/ReviewsPage';
import { AppointmentProvider } from './context/AppointmentContext';

const App: React.FC = () => {
  return (
    <AppointmentProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-100">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BookingPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" />
      </Router>
    </AppointmentProvider>
  );
};

export default App;