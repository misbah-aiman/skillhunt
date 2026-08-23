import { supabase } from '../lib/supabaseClient';
import './Home.css';

const quote = {
  text: 'The expert in anything was once a beginner.',
  author: 'Helen Hayes',
};

export function Home() {
  return (
    <main className="home">
      <h1>SkillHunt</h1>
      <p className="tagline">Find the skills that find you the job.</p>
      <blockquote>
        "{quote.text}"
        <footer>&mdash; {quote.author}</footer>
      </blockquote>
      <button className="link-button" onClick={() => supabase.auth.signOut()}>
        Sign Out
      </button>
    </main>
  );
}
