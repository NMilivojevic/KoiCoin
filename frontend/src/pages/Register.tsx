import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

interface RegisterProps {
  onLogin: (token: string) => void;
}

const Register = ({ onLogin }: RegisterProps) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshRates } = useCurrency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, name, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data for currency context
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token);
        // Refresh exchange rates after successful registration
        refreshRates();
      } else {
        setError(data.error || 'Registration failed');
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
          <h2 className="text-3xl font-bold text-koi-text mb-2">Join KoiCoin</h2>
          <p className="text-koi-muted">Create your financial pond</p>
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
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className="block text-sm text-koi-muted mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-koi-deep border border-koi-border rounded-lg text-koi-text placeholder-koi-muted focus:outline-none focus:border-koi-orange focus:ring-1 focus:ring-koi-orange"
                placeholder="Enter your full name"
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
                placeholder="Create password"
              />
            </div>

            <div>
              <label className="block text-sm text-koi-muted mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-koi-deep border border-koi-border rounded-lg text-koi-text placeholder-koi-muted focus:outline-none focus:border-koi-orange focus:ring-1 focus:ring-koi-orange"
                placeholder="Confirm password"
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-koi-muted">Already have an account? </span>
            <Link to="/login" className="text-koi-blue hover:text-koi-gold transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;