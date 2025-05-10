// src/App.tsx
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginSignup } from "./features/authentication";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar'; // Navbar se usará globalmente post-login
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';
import 'react-day-picker/dist/style.css';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
// import ExportDataPage from './pages/ExportDataPage'; // REMOVED old import
import DataManagementPage from './pages/DataManagementPage'; // ADDED new import
import AppLayout from './layouts/AppLayout';
import { InsightDisplay } from './features/registroConciencia/components/InsightDisplay'; // Added InsightDisplay import
// Updated import path for analyzeRecentPatterns
import { analyzeRecentPatterns } from './features/registroConciencia/services/dataManagementService';
import { Insight } from './types/registro'; // Added Insight type import


const ConcienciaSectionLayout: React.FC = () => {
  // Note: If insights should be visible *within* the Conciencia section,
  // you might need to fetch them here or pass them down from AppContent.
  return <AppLayout />;
};

const DefaultPageContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="text-center mb-8 mt-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">App Base con Autenticación</h1>
        {user && (
          <p className="text-md sm:text-lg text-gray-600 dark:text-gray-400 mt-2">
            Bienvenido, {user.email}
          </p>
        )}
      </header>
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]); // State for insights
  const [refresherKey, setRefresherKey] = useState(0); // State to trigger refresh

  // Function to trigger a global data refresh
  const triggerGlobalRefresh = () => {
    setRefresherKey(prevKey => prevKey + 1);
  };

  // Fetch insights when user changes or refresh is triggered
  useEffect(() => {
    if (user) {
      analyzeRecentPatterns(user.id)
        .then(setInsights)
        .catch(error => {
          console.error("Error fetching insights:", error);
          setInsights([]); // Clear insights on error
        });
    } else {
      setInsights([]); // Clear insights if user logs out
    }
  }, [user, refresherKey]); // Depend on user and refresherKey

  // console.log("AppContent: loading:", loading, "user:", user ? user.email : null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {user && <Navbar />}

      <main className="flex-grow overflow-y-auto">
        <Routes>
          {!user ? (
            <Route path="/*" element={<LoginSignup />} />
          ) : (
            <>
              <Route path="/" element={<DefaultPageContent><HomePage /></DefaultPageContent>} />
              <Route path="/about" element={<DefaultPageContent><AboutPage /></DefaultPageContent>} />
              {/* Updated route to use DataManagementPage and pass refresh prop */}
              <Route path="/data-management" element={<DefaultPageContent><DataManagementPage triggerGlobalRefresh={triggerGlobalRefresh} /></DefaultPageContent>} />
              <Route path="/conciencia/*" element={<ConcienciaSectionLayout />} />

              {/* Redirige cualquier otra ruta de usuario logueado a la página de inicio */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
        {/* Render InsightDisplay when user is logged in and there are insights */}
        {user && insights.length > 0 && (
           <div className="container mx-auto p-4 sm:p-6 lg:p-8">
             <InsightDisplay insights={insights} />
           </div>
        )}
      </main>

      {user && <Footer />}
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