import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

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

    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error ?? 'Failed to send code.');
      setLoading(false);
      return;
    }

    setStep('otp');
    setLoading(false);
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    // App.tsx picks that up and switches to Home.
  }

  if (step === 'otp') {
    return (
      <form className="auth-form" onSubmit={handleVerifyOtp}>
        <h1>Enter Your Code</h1>
        <p className="auth-message">We emailed a login code to {email}.</p>

        <label htmlFor="otp-code">Login Code</label>
        <input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <p className="auth-switch">
          <button type="button" className="link-button" onClick={() => setStep('email')}>
            Use a different email
          </button>
        </p>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSendOtp}>
      <h1>Sign In</h1>
      <p className="auth-message">Enter your email and we'll send you a login code.</p>

      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Login Code'}
      </button>
    </form>
  );
}
