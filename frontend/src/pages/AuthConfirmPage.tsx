import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthConfirmPage() {
  const navigate = useNavigate();
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

        // PKCE flow
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
        if (session || hash.includes('access_token') || hash.includes('type=signup') || code) {
          setIsSuccess(true);
        } else {
          // If no error was provided and user landed here, mark as confirmed/ready to login
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 mb-6">
            <Brain className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">MeetMind AI</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          {loading ? (
            <div className="py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verifying your email...</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we confirm your account.</p>
            </div>
          ) : isSuccess ? (
            <div className="py-4 space-y-5">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto text-green-600 dark:text-green-400 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 mb-2">
                  Confirmation Done
                </span>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified Successfully!</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Your account is now fully verified. You can proceed to log in and start using MeetMind AI.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium inline-flex items-center justify-center gap-2 transition shadow-sm"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-5">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verification Link Notice</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {errorMsg || 'This link may have already been used or expired. If you have already confirmed your email, you can log in below.'}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  to="/login"
                  className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium inline-flex items-center justify-center gap-2 transition shadow-sm"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                >
                  Create another account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
