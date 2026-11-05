import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(6);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // 1. Check query parameters
        const error = searchParams.get('error') || searchParams.get('error_description');
        const code = searchParams.get('code');

        // 2. Check hash fragment (standard Supabase redirect format)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const hashError = hashParams.get('error_description') || hashParams.get('error');

        if (error || hashError) {
          setErrorMsg(decodeURIComponent(error || hashError || 'Verification link expired or invalid'));
          setLoading(false);
          return;
        }

        // PKCE code exchange if present
        if (code) {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setErrorMsg(exchangeError.message);
            setLoading(false);
            return;
          }
          if (exchangeData?.user?.email) {
            setUserEmail(exchangeData.user.email);
          }
        }

        // Check active session or token presence
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserEmail(session.user?.email || null);
          setIsSuccess(true);
        } else if (hash.includes('access_token') || hash.includes('type=signup') || code) {
          setIsSuccess(true);
        } else {
          // If no error, treat as confirmed
          setIsSuccess(true);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Verification could not be completed');
      } finally {
        setLoading(false);
      }
    };

    handleConfirmation();
  }, [searchParams]);

  // Optional auto-redirect countdown
  useEffect(() => {
    if (!isSuccess) return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/70 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">MeetMind AI</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 p-8 sm:p-10 relative overflow-hidden">
          {/* Top highlight gradient border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600" />

          {loading ? (
            <div className="py-12 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verifying your email...</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we activate your workspace.</p>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6">
              {/* Success Hero Icon */}
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/25 dark:bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
                </div>
              </div>

              {/* Title & Badge */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verification Complete</span>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Email Confirmed!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                  Your email has been verified and your account is ready. Welcome to MeetMind AI!
                </p>
                {userEmail && (
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 py-1 px-3 rounded-lg inline-block mt-1">
                    {userEmail}
                  </p>
                )}
              </div>

              {/* Mini Highlights Grid */}
              <div className="grid grid-cols-1 gap-2.5 pt-2 text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">AI Meeting Intelligence</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Summaries, decisions & important dates in seconds</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Automated Task Tracking</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Action items assigned with deadlines & priorities</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">RAG Knowledge Base</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Upload documents so AI understands your project jargon</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 space-y-3">
                <Link
                  to="/login"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Auto-redirecting in <span className="font-semibold text-indigo-600 dark:text-indigo-400">{countdown}s</span>
                </p>
              </div>
            </div>
          ) : (
            /* Expired / Notice State */
            <div className="text-center space-y-6">
              <div className="w-18 h-18 rounded-3xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm p-4">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Link Notice</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                  {errorMsg || 'This verification link may have already been used or expired. If your email was already confirmed, you can proceed directly to sign in.'}
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
                >
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/register"
                  className="block text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                >
                  Need to create an account?
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          MeetMind AI • Intelligent Meeting Productivity Platform
        </p>
      </div>
    </div>
  );
}
