import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshRates } = useCurrency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data for currency context
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token);
        // Refresh exchange rates after successful login
        refreshRates();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-water flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-koi-text mb-2">🐠 KoiCoin</h2>
          <p className="text-koi-muted">Dive into your financial pond</p>
        </div>

        {/* Form */}
        <div className="bg-koi-dark p-8 rounded-lg border border-koi-border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-koi-muted mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-koi-deep border border-koi-border rounded-lg text-koi-text placeholder-koi-muted focus:outline-none focus:border-koi-orange focus:ring-1 focus:ring-koi-orange"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm text-koi-muted mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-koi-deep border border-koi-border rounded-lg text-koi-text placeholder-koi-muted focus:outline-none focus:border-koi-orange focus:ring-1 focus:ring-koi-orange"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-koi-orange text-koi-text py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium transition-colors shadow-lg"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-koi-muted">Don't have an account? </span>
            <Link to="/register" className="text-koi-blue hover:text-koi-gold transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;