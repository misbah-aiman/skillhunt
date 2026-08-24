import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ProfileSetup } from '../pages/ProfileSetup';

interface OnboardedRouteProps {
  session: Session;
  isOnboarded: boolean;
  onOnboarded: () => void;
  children: ReactNode;
}

// Guards its children behind onboarding: redirects to profile setup
// until the signed-in user has a profile row.
export function OnboardedRoute({ session, isOnboarded, onOnboarded, children }: OnboardedRouteProps) {
  if (!isOnboarded) {
    return <ProfileSetup session={session} onComplete={onOnboarded} />;
  }

  return <>{children}</>;
}
