/**
 * Plays the logo "test run" (src/components/TestRun.astro): once by itself when it comes into
 * view (unless the visitor prefers reduced motion), and whenever the button is pressed.
 */
const RUN_MS = 2600;
const AGAIN_LABEL = '▶ Run again';
const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function run(figure: HTMLElement, button: HTMLButtonElement) {
  button.disabled = true;
  figure.classList.remove('is-running');
  void figure.getBoundingClientRect(); // restart the CSS animation
  figure.classList.remove('is-armed');
  figure.classList.add('is-running');
  window.setTimeout(() => {
    figure.classList.remove('is-running');
    button.textContent = AGAIN_LABEL;
    button.disabled = false;
  }, RUN_MS);
}

function playWhenVisible(figure: HTMLElement, button: HTMLButtonElement) {
  figure.classList.add('is-armed');
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run(figure, button);
    },
    { threshold: 0.5 },
  );
  observer.observe(figure);
}

for (const figure of document.querySelectorAll<HTMLElement>('[data-test-run]')) {
  const button = figure.querySelector<HTMLButtonElement>('.again')!;
  button.hidden = false;
  button.addEventListener('click', () => run(figure, button));
  if (autoplay) playWhenVisible(figure, button);
}
