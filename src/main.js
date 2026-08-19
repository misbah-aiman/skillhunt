import './style.css';

const quote = {
  text: 'The expert in anything was once a beginner.',
  author: 'Helen Hayes',
};

document.querySelector('#app').innerHTML = `
  <main>
    <h1>SkillHunt</h1>
    <p class="tagline">Find the skills that find you the job.</p>
    <blockquote>
      "${quote.text}"
      <footer>&mdash; ${quote.author}</footer>
    </blockquote>
  </main>
`;
