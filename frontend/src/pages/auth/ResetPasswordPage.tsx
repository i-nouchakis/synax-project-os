import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { api } from '@/lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenError('No reset token provided');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await api.get<{ valid: boolean; email: string }>(
          `/auth/verify-reset-token/${token}`
        );
        setEmail(response.email);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'message' in err) {
          setTokenError((err as { message: string }).message);
        } else {
          setTokenError('Invalid or expired reset token');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setIsReset(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.png" alt="Synax" className="h-12 w-12" />
            <h1 className="text-h1 font-bold text-primary">Synax</h1>
          </div>
          <p className="text-body text-text-secondary">
            ICT Project & Asset Management
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Set New Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="text-primary animate-spin mx-auto mb-4" />
                <p className="text-body-sm text-text-secondary">
                  Verifying reset link...
                </p>
              </div>
            ) : tokenError ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-error" />
                </div>
                <h3 className="text-heading text-text-primary mb-2">
                  Invalid Reset Link
                </h3>
                <p className="text-body-sm text-text-secondary mb-6">
                  {tokenError}
                </p>
                <Link to="/forgot-password">
                  <Button variant="secondary">Request New Link</Button>
                </Link>
              </div>
            ) : isReset ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h3 className="text-heading text-text-primary mb-2">
                  Password Reset!
                </h3>
                <p className="text-body-sm text-text-secondary mb-6">
                  Your password has been successfully reset. You can now log in
                  with your new password.
                </p>
                <Button onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {email && (
                  <p className="text-body-sm text-text-secondary">
                    Reset password for: <strong>{email}</strong>
                  </p>
                )}

                {error && (
                  <div className="bg-error/10 border border-error/20 rounded-md p-3">
                    <p className="text-body-sm text-error">{error}</p>
                  </div>
                )}

                <Input
                  type="password"
                  label="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoFocus
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password || !confirmPassword}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary"
                  >
                    <ArrowLeft size={14} />
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
