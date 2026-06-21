'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

interface LoginPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LoginPage({ onSuccess, onCancel }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'خطا در ورود');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-accent-soft flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-sage to-sky flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white opacity-70"></div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-ink mb-2">
          کلینیک آرامش
        </h1>
        <p className="text-center text-ink-muted mb-8">
          ورود پرسنل
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              ایمیل
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@clinic.com"
              className="w-full px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-soft border border-rose text-rose rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'درحال ورود...' : 'ورود'}
          </button>
        </form>

        <button
          onClick={onCancel}
          className="w-full mt-4 py-2.5 border border-line text-ink rounded-lg font-medium hover:bg-bg-soft transition-colors"
        >
          بازگشت
        </button>

        <p className="text-center text-xs text-ink-muted mt-6">
          ورود محدود به پرسنل مجاز
        </p>
      </div>
    </div>
  );
}
