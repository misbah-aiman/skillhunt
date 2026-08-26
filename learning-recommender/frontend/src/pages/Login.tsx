import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { inputClasses, labelClasses, primaryButtonClasses } from '../lib/ui';

type Step = 'email' | 'otp';

export function Login() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to send code.');
        return;
      }

      setStep('otp');
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // supabase-js persists the session and fires onAuthStateChange;
      // App.tsx picks that up and switches to Dashboard.
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
      setLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <form
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-stone-200 bg-white p-8 text-left shadow-sm"
        onSubmit={handleVerifyOtp}
      >
        <h1 className="text-2xl font-semibold text-stone-800">Enter Your Code</h1>
        <p className="text-sm text-emerald-700">We emailed a login code to {email}.</p>

        <label htmlFor="otp-code" className={`${labelClasses} mt-2`}>
          Login Code
        </label>
        <input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className={inputClasses}
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className={`${primaryButtonClasses} mt-2`}>
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <p className="text-center text-sm">
          <button
            type="button"
            className="font-medium text-emerald-700 hover:text-emerald-800"
            onClick={() => setStep('email')}
          >
            Use a different email
          </button>
        </p>
      </form>
    );
  }

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-stone-200 bg-white p-8 text-left shadow-sm"
      onSubmit={handleSendOtp}
    >
      <h1 className="text-2xl font-semibold text-stone-800">Sign In</h1>
      <p className="text-sm text-emerald-700">Enter your email and we'll send you a login code.</p>

      <label htmlFor="login-email" className={`${labelClasses} mt-2`}>
        Email
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClasses}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button type="submit" disabled={loading} className={`${primaryButtonClasses} mt-2`}>
        {loading ? 'Sending...' : 'Send Login Code'}
      </button>
    </form>
  );
}
