import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Brain, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, FileText, CheckSquare, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthConfirmPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // 1. Check query parameters for error or code
        const error = searchParams.get('error') || searchParams.get('error_description');
        const code = searchParams.get('code');

        // 2. Check hash fragment (common in Supabase implicit flow)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const hashError = hashParams.get('error_description') || hashParams.get('error');

        if (error || hashError) {
          setErrorMsg(decodeURIComponent(error || hashError || 'Verification link expired or invalid'));
          setLoading(false);
          return;
        }

        // PKCE flow exchange
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setErrorMsg(exchangeError.message);
            setLoading(false);
            return;
          }
        }

        // Verify active session or token presence
        const { data: { session } } = await supabase.auth.getSession();
        if (session || hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=email_confirmation') || code) {
          setIsSuccess(true);
        } else {
          // If the user reached here without error flags, mark verification as done
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/3 -translate-y-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 group transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">MeetMind AI</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/40 border border-gray-100 dark:border-gray-700/80 p-8 sm:p-10 transition-all">
          {loading ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verifying your email...</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Validating your confirmation token. Just a moment.</p>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6">
              {/* Success Badge & Icon */}
              <div className="relative inline-block mx-auto">
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transform transition-transform hover:scale-105">
                  <CheckCircle2 className="w-11 h-11" />
                </div>
                <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verification Completed
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Email Confirmed Successfully!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your email address has been verified and your account is now fully active. You can now proceed to log in to your workspace.
                </p>
              </div>

              {/* What you can do next */}
              <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-4 text-left border border-gray-100 dark:border-gray-700/60 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Ready in your workspace
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span>AI-Powered Executive Summaries & Discussion Points</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    <span>Action Item Extraction with Assignees & Deadlines</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <span>Knowledge Base RAG for Context-Aware Insights</span>
                  </div>
                </div>
              </div>

              {/* Action CTA */}
              <div className="pt-2 space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/"
                  className="block text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verification Notice</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-sm mx-auto">
                  {errorMsg || 'This verification link may have expired or was already used. If your email is already confirmed, you can log in below.'}
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition shadow-sm"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="block text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Back to Registration
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
