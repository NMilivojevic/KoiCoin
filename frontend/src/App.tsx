import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import { CurrencyProvider } from './context/CurrencyContext';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage on app load
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-koi-deep flex items-center justify-center">
        <div className="text-xl text-koi-text">Loading KoiCoin...</div>
      </div>
    );
  }

  return (
    <CurrencyProvider>
      <Router>
        <div className="min-h-screen bg-gradient-koi">
          <Routes>
            {!token ? (
              <>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<Register onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
                <Route path="/expenses" element={<Expenses onLogout={handleLogout} />} />
                <Route path="/income" element={<Income onLogout={handleLogout} />} />
                <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;
