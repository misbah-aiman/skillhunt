import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Login } from './pages/Login';
import { ProfilePage } from './pages/ProfilePage';
import { TopicsPage } from './pages/TopicsPage';
import { ChatPage } from './pages/ChatPage';
import { CallPage } from './pages/CallPage';
import { PersonaPage } from './pages/PersonaPage';
import { LearningPathPage } from './pages/LearningPathPage';
import { DashboardPage } from './pages/DashboardPage';
import { NavBar, type View } from './components/NavBar';
import { OnboardedRoute } from './components/OnboardedRoute';
import { Spinner } from './components/Spinner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
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
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Spinner size={28} label="Loading SkillHunt..." />
      </div>
    );
  }

  if (session) {
    if (isOnboarded === null) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Spinner size={28} label="Loading your profile..." />
        </div>
      );
    }

    const goToChat = () => setView('chat');
    const goToCall = () => setView('call');
    const goToPersona = () => setView('persona');

    return (
      <OnboardedRoute session={session} isOnboarded={isOnboarded} onOnboarded={() => setIsOnboarded(true)}>
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-8 sm:pb-8">
          <NavBar view={view} onNavigate={setView} onSignOut={() => supabase.auth.signOut()} />
          <div className="animate-fade-up" key={view}>
            {view === 'dashboard' && <DashboardPage session={session} onNavigateToChat={goToChat} />}
            {view === 'topics' && <TopicsPage />}
            {view === 'persona' && <PersonaPage onNavigateToChat={goToChat} onNavigateToCall={goToCall} />}
            {view === 'chat' && <ChatPage session={session} />}
            {view === 'call' && <CallPage session={session} onEndCall={goToPersona} />}
            {view === 'path' && <LearningPathPage session={session} onNavigateToChat={goToChat} />}
            {view === 'profile' && <ProfilePage session={session} />}
          </div>
        </div>
      </OnboardedRoute>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Login />
    </div>
  );
}

export default App;
