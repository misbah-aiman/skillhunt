import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { ProfilePage } from './pages/ProfilePage';
import { TopicsPage } from './pages/TopicsPage';
import { ChatPage } from './pages/ChatPage';
import { LearningPathPage } from './pages/LearningPathPage';
import { DashboardPage } from './pages/DashboardPage';
import { NavBar, type View } from './components/NavBar';
import { OnboardedRoute } from './components/OnboardedRoute';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (!session) {
      setIsOnboarded(null);
      return;
    }

    const accessToken = session.access_token;
    let cancelled = false;

    // A user counts as onboarded once they have a profile row; there's no
    // separate flag to track since profile creation only happens here.
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (!cancelled) {
          setIsOnboarded(json.ok ? json.profile !== null : true);
        }
      } catch {
        if (!cancelled) {
          setIsOnboarded(true);
        }
      }
    }

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading) {
    return null;
  }

  if (session) {
    if (isOnboarded === null) {
      return null;
    }

    return (
      <OnboardedRoute session={session} isOnboarded={isOnboarded} onOnboarded={() => setIsOnboarded(true)}>
        <NavBar view={view} onNavigate={setView} onSignOut={() => supabase.auth.signOut()} />
        {view === 'home' && <Home />}
        {view === 'dashboard' && <DashboardPage session={session} onNavigateToChat={() => setView('chat')} />}
        {view === 'topics' && <TopicsPage />}
        {view === 'chat' && <ChatPage session={session} />}
        {view === 'path' && <LearningPathPage session={session} />}
        {view === 'profile' && <ProfilePage session={session} />}
      </OnboardedRoute>
    );
  }

  return (
    <div className="auth-container">
      <Login />
    </div>
  );
}

export default App;
