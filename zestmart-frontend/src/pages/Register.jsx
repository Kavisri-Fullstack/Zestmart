import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthPanel from '../components/layout/AuthPanel';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await register(form);
    setSubmitting(false);
    if (res.success) {
      toast.success('Account created!');
      navigate('/');
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
          <h1 className="font-display text-3xl font-semibold">Create an account</h1>
          <p className="mt-1.5 text-sm text-ink/60">Join ZestMart in seconds.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91XXXXXXXXXX" />
            </div>
            <div>
              <label className="label">Password</label>
              <input required minLength={8} type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn-primary w-full py-3" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink/60">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
