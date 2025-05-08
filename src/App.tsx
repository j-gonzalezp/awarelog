import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginSignup } from "./features/authentication";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import 'react-day-picker/dist/style.css';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col flex-grow">
        <header className="text-center mb-8 mt-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">App Base con Autenticación</h1>
          {user && (
            <p className="text-md sm:text-lg text-gray-600 dark:text-gray-400 mt-2">
              Bienvenido, {user.email}
            </p>
          )}
        </header>

        <main className="flex-grow">
          {!user ? (
            <div className="max-w-md mx-auto">
              <LoginSignup />
            </div>
          ) : (
            <>
              <Navbar />
              <div className="pt-4">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                </Routes>
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;