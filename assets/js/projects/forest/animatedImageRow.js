// assets/js/projects/forest/animatedImageRow.js
(() => {
  const sections = document.querySelectorAll('.animated-image-row-section');
  if (!sections.length) return;

  const gsapApi = window.gsap;
  const scrollTriggerApi = window.ScrollTrigger;
  if (!gsapApi || !scrollTriggerApi) return;

  gsapApi.registerPlugin(scrollTriggerApi);

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  sections.forEach((section) => {
    section.style.setProperty('--t', '0');
    scrollTriggerApi.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const t = smoothstep(clamp(self.progress, 0, 1));
        section.style.setProperty('--t', t.toFixed(4));
      }
    });
  });
})();
