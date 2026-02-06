// assets/js/projects/forest/animatedImageRow.js
(() => {
  const sections = document.querySelectorAll('.animated-image-row-section');
  if (!sections.length) return;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  let rafId = null;
  const update = () => {
    rafId = null;
    const vh = window.innerHeight || 1;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const raw = (vh - rect.top) / (vh + rect.height);
      const t = smoothstep(clamp(raw, 0, 1));
      section.style.setProperty('--t', t.toFixed(4));
    });
  };

  const onScroll = () => {
    if (!rafId) rafId = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  update();
})();
