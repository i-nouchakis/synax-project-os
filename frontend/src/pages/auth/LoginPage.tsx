import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-display text-primary font-bold">Synax</h1>
          <p className="text-body text-text-secondary mt-2">
            Project & Asset Management Platform
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-h2">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-body-sm">
                  {error}
                </div>
              )}

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-tertiary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-border bg-background text-primary focus:ring-primary"
                  />
                  <span className="text-body-sm text-text-secondary">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-body-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                leftIcon={<LogIn size={18} />}
              >
                Sign in
              </Button>
            </form>

            {/* Demo accounts info */}
            <div className="mt-6 p-3 rounded-md bg-surface-secondary border border-surface-border">
              <p className="text-caption text-text-secondary mb-2 font-medium">Demo Accounts:</p>
              <div className="space-y-1 text-caption text-text-tertiary">
                <p>admin@synax.app / admin123</p>
                <p>pm@synax.app / pm123456</p>
                <p>tech@synax.app / tech123456</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-caption text-text-tertiary mt-6">
          © 2026 Synax by Elecnet. All rights reserved.
        </p>
      </div>
    </div>
  );
}
