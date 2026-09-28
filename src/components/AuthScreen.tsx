import { useState } from 'react';
import { GraduationCap, Loader2, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'sign-in' | 'sign-up';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if ( signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setError(message === 'Invalid login credentials' ? 'Wrong email or password. Double-check and try again.' : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#08100f] px-4 text-[#eef4ed]">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#c8f36c] text-[#08100f] shadow-[0_0_30px_rgba(200,243,108,0.25)]">
            <GraduationCap size={28} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Free Class Locator</h1>
            <p className="mt-1 text-sm text-[#7f8e87]">Sign in to find your next quiet corner.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#101d1a] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-6 flex rounded-xl border border-white/[0.08] bg-[#0b1513] p-1">
            <button
              onClick={() => { setMode('sign-in'); setError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'sign-in' ? 'bg-[#c8f36c] text-[#08100f]' : 'text-[#84938b] hover:text-white'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode('sign-up'); setError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'sign-up' ? 'bg-[#c8f36c] text-[#08100f]' : 'text-[#84938b] hover:text-white'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#74847c]">Email</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-[#0b1513] px-4 transition focus-within:border-[#c8f36c]/50">
                <Mail size={17} className="shrink-0 text-[#65756d]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@campus.edu"
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-[#5a6961]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#74847c]">Password</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-[#0b1513] px-4 transition focus-within:border-[#c8f36c]/50">
                <Lock size={17} className="shrink-0 text-[#65756d]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-[#5a6961]"
                />
              </div>
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-xs text-red-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8f36c] py-3.5 text-sm font-bold text-[#08100f] transition hover:bg-[#ddff91] disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#65756d]">
            {mode === 'sign-in' ? "Don't have an account? " : 'Already registered? '}
            <button
              onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); }}
              className="font-semibold text-[#c8f36c] hover:underline"
            >
              {mode === 'sign-in' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
