import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Loader2, Mail, CheckCircle2, ArrowRight, RotateCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, resendVerificationEmail } = useAuth();
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const strength = (() => {
    const p = form.password;
    if (!p) return { level: 0, text: '', color: '' };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const map: Record<number, { text: string; color: string }> = {
      0: { text: 'Very weak', color: 'bg-red-500' },
      1: { text: 'Weak', color: 'bg-red-400' },
      2: { text: 'Fair', color: 'bg-amber-400' },
      3: { text: 'Good', color: 'bg-green-400' },
      4: { text: 'Strong', color: 'bg-green-600' },
    };
    return { level: s, ...map[s] };
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.username || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // User must verify email before accessing their account.
      // Force sign-out to guarantee no premature auto-login.
      await supabase.auth.signOut();

      // Display the verification screen and email instructions
      setRegisteredEmail(form.email);
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      if (msg.toLowerCase().includes('rate limit')) {
        toast.error('Email rate limit exceeded by Supabase. Please wait a few minutes before trying again.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail && !form.email) return;
    const targetEmail = registeredEmail || form.email;
    setResending(true);
    try {
      await resendVerificationEmail(targetEmail);
      toast.success('Verification email resent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 group transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">MeetMind AI</span>
          </Link>
        </div>

        {/* Dynamic Card: switches to Verification Sent screen on submission */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/40 border border-gray-100 dark:border-gray-700/80 p-8 transition-all">
          {registeredEmail ? (
            /* Verification Required Screen */
            <div className="text-center space-y-6">
              <div className="relative inline-block mx-auto">
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Mail className="w-10 h-10 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verification Email Sent
                </span>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Verify your email in Gmail
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  We sent a confirmation link to:
                </p>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 break-all">
                  {registeredEmail}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Your account is protected and cannot be accessed until your email has been confirmed.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-750/50 p-4 rounded-2xl text-left space-y-2.5 border border-gray-100 dark:border-gray-700/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  What to do next
                </p>
                <div className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Open your <strong>Gmail / inbox</strong> (check Spam folder if needed).</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Click the <strong>"Confirm your signup"</strong> link inside the email.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>You will see the <strong>"Email Confirmed Successfully!"</strong> page and can then log in.</span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35"
                >
                  Open Gmail <ExternalLink className="w-4 h-4" />
                </a>

                <Link
                  to="/login"
                  className="w-full py-3 px-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-medium text-xs inline-flex items-center justify-center gap-1.5 transition"
                >
                  Proceed to Sign In <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 px-1">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1 transition disabled:opacity-50"
                  >
                    {resending ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Resending...</>
                    ) : (
                      <><RotateCw className="w-3 h-3" /> Resend email</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisteredEmail(null)}
                    className="hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    Use another email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Get started with MeetMind AI</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => set('full_name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => set('username', e.target.value)}
                    placeholder="johndoe"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-600'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{strength.text}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={e => set('confirm', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
