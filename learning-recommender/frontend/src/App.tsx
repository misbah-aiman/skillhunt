import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Login } from './pages/Login';
import { ProfilePage } from './pages/ProfilePage';
import { CallPage } from './pages/CallPage';
import { LearningPathPage } from './pages/LearningPathPage';
import { DashboardPage } from './pages/DashboardPage';
import { NavBar, type View } from './components/NavBar';
import { OnboardedRoute } from './components/OnboardedRoute';
import { Spinner } from './components/Spinner';
import { ChatWidget } from './components/ChatWidget';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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

    const openChat = () => setChatOpen(true);
    const openCall = () => setView('call');

    return (
      <OnboardedRoute session={session} isOnboarded={isOnboarded} onOnboarded={() => setIsOnboarded(true)}>
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-[calc(9rem+env(safe-area-inset-bottom,0px))] sm:px-8 sm:pb-8">
          <NavBar view={view} onNavigate={setView} onSignOut={() => supabase.auth.signOut()} />
          <div className="animate-fade-up" key={view}>
            {view === 'dashboard' && <DashboardPage session={session} onNavigateToChat={openChat} />}
            {view === 'call' && <CallPage session={session} onEndCall={() => setView('dashboard')} />}
            {view === 'path' && <LearningPathPage />}
            {view === 'profile' && <ProfilePage onNavigateToChat={openChat} />}
          </div>
        </div>

        {view !== 'call' && (
          <ChatWidget session={session} open={chatOpen} onOpenChange={setChatOpen} onOpenCall={openCall} />
        )}
      </OnboardedRoute>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
      <Login />
    </div>
  );
}

export default App;
