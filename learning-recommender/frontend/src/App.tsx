import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { NavBar, type View } from './components/NavBar';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (session) {
    return (
      <>
        <NavBar view={view} onNavigate={setView} onSignOut={() => supabase.auth.signOut()} />
        {view === 'home' ? <Home /> : <Profile session={session} />}
      </>
    );
  }

  return (
    <div className="auth-container">
      <Login />
    </div>
  );
}

export default App;
