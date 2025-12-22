"use client"
import { clearSessionCookie } from '@/actions/auth/action';
import { Button } from '@/components/ui/button';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';

const SessionExpire = () => {

  useEffect(() => {
    const performLogout = async () => {
      await clearSessionCookie();
    };
    performLogout();
  }, []);

  const handleLoginRedirect = () => {
    window.location.href = '/auth/login';
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white dark:bg-darkPrimaryBg px-6 py-24 text-center sm:py-32 lg:px-8">
      <div className="max-w-md">
        {/* Icon Header */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-slate-100 p-4">
            <ShieldAlert className="h-10 w-10 text-slate-600" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-darkTextPrimary sm:text-4xl">
          Session Expired
        </h1>

        <div className="mt-4 border-b border-gray-300 dark:border-darkBorder pb-6">
          <p className="text-lg leading-7 text-slate-600 dark:text-darkTextSecondary">
            Your session has expired. To continue your progress,
            please log in to your account again.
          </p>
        </div>

        {/* Action Area */}
        <div className="mt-8 flex flex-col items-center justify-center gap-y-4">
          <Button
            onClick={handleLoginRedirect}
            size="lg"
            className="w-full sm:w-64 text-base shadow-md transition-all hover:scale-[1.02]"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign Back In
          </Button>

          <button
            onClick={() => window.location.href = '/auth/forgot-password'}
            className="text-sm font-semibold leading-6 text-slate-500 hover:text-slate-900 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
          >
            Forgot Password ? <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpire;