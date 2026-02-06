// assets/js/projects/forest/animatedCircleSection.js
(() => {
  const sections = document.querySelectorAll('.animated-circle-section');
  if (!sections.length) return;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  document.querySelectorAll('.animated-circle-section .circle-item').forEach((item) => {
    item.style.setProperty('--rand', Math.random().toFixed(3));
    item.style.setProperty('--angle', `${(Math.random() * 360).toFixed(1)}deg`);
    item.style.setProperty('--spin', `${(Math.random() * 60 - 30).toFixed(1)}deg`);
    item.style.setProperty('--randx', `${((Math.random() * 2 - 1) * 720).toFixed(1)}px`);
    item.style.setProperty('--randy', `${((Math.random() * 2 - 1) * 420).toFixed(1)}px`);
    item.style.setProperty('--randz', `${((Math.random() * 2 - 1) * 1900).toFixed(1)}px`);
    item.style.setProperty('--scale0', (0.7 + Math.random() * 0.8).toFixed(2));
    item.style.setProperty('--scaleGrow', (2.0 + Math.random() * 2.5).toFixed(2));
  });

  let rafId = null;
  const update = () => {
    rafId = null;
    const vh = window.innerHeight || 1;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + scrollY;
      const scrollSpan = Math.max(section.offsetHeight - vh, 1);
      const raw = (scrollY - sectionTop) / scrollSpan;
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
