/** Plays the logo "test run" (src/components/TestRun.astro) once on view, and again on request. */
const RUN_MS = 2600;
const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function run(figure: HTMLElement, again: HTMLButtonElement) {
  again.hidden = true;
  figure.classList.remove('is-running');
  void figure.getBoundingClientRect(); // restart the CSS animation
  figure.classList.remove('is-armed');
  figure.classList.add('is-running');
  window.setTimeout(() => {
    figure.classList.remove('is-running');
    again.hidden = false;
  }, RUN_MS);
}

for (const figure of document.querySelectorAll<HTMLElement>('[data-test-run]')) {
  const again = figure.querySelector<HTMLButtonElement>('.again')!;
  if (!motionAllowed) continue;
  figure.classList.add('is-armed');
  again.addEventListener('click', () => run(figure, again));
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run(figure, again);
    },
    { threshold: 0.6 },
  );
  observer.observe(figure);
}
