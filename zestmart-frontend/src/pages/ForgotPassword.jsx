import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { extractError } from '../api/client';
import AuthPanel from '../components/layout/AuthPanel';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      toast.success('If that account exists, an OTP has been sent.');
      setStep('otp');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.verifyOtp({ email, code, purpose: 'password_reset' });
      setResetToken(res.data.data.resetToken);
      setStep('reset');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword });
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthPanel />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <Link to="/" className="mb-8 inline-block font-display text-2xl font-semibold text-teal-700 lg:hidden">
            Zest<span className="text-marigold-600">Mart</span>
          </Link>
          <h1 className="font-display text-3xl font-semibold">Reset your password</h1>

          <div className="mt-6 flex gap-1.5">
            {['email', 'otp', 'reset'].map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${['email', 'otp', 'reset'].indexOf(step) >= i ? 'bg-teal-600' : 'bg-sand'}`} />
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={requestOtp} className="mt-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn-primary w-full py-3" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyOtp} className="mt-6 space-y-4">
              <p className="text-sm text-ink/60">Enter the 6-digit code sent to {email}.</p>
              <div>
                <label className="label">OTP code</label>
                <input required maxLength={6} className="input" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <button className="btn-primary w-full py-3" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Verify code'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={resetPassword} className="mt-6 space-y-4">
              <div>
                <label className="label">New password</label>
                <input required minLength={8} type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <button className="btn-primary w-full py-3" disabled={submitting}>
                {submitting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-ink/60">
            <Link to="/login" className="font-semibold text-teal-700 hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
