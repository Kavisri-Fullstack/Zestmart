import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthPanel from '../components/layout/AuthPanel';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await login(form.email, form.password);
    setSubmitting(false);
    if (res.success) {
      toast.success('Welcome back!');
      navigate(location.state?.from || '/');
    } else {
      toast.error(res.message);
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
          <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink/60">Sign in to continue to your account.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input required type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-teal-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <button className="btn-primary w-full py-3" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink/60">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-teal-700 hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
