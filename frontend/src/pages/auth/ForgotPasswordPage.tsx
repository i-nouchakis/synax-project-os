import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { api } from '@/lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
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
              <Mail size={20} />
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h3 className="text-heading text-text-primary mb-2">
                  Check your email
                </h3>
                <p className="text-body-sm text-text-secondary mb-6">
                  If an account exists with <strong>{email}</strong>, we've sent
                  instructions to reset your password.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-body-sm text-text-secondary">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>

                {error && (
                  <div className="bg-error/10 border border-error/20 rounded-md p-3">
                    <p className="text-body-sm text-error">{error}</p>
                  </div>
                )}

                <Input
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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
