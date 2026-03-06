(() => {
  const section = document.querySelector('.cambodia-street-section');
  if (!section || !window.gsap) return;

  const imagesWrap = section.querySelector('.cambodia-street-images');
  const dataEl = section.querySelector('.cambodia-street-gallery-data');
  if (!imagesWrap || !dataEl) return;

  const data = JSON.parse(dataEl.textContent || '{}');
  const layout = Array.isArray(data.layout) ? data.layout : [];
  const all = Array.isArray(data.all) ? data.all : [];
  const getImageByPosition = (position) => {
    const match = layout.find((entry) => entry && Number(entry.position) === position && typeof entry.path === 'string');
    return match ? match.path : null;
  };

  const firstImagePath = getImageByPosition(1) || (layout[0] && layout[0].path) || all[0];
  if (!firstImagePath) return;

  const img1 = new Image();
  img1.className = 'cambodia-street-image-1';
  img1.alt = 'Cambodia Street opening image';
  img1.src = firstImagePath;
  imagesWrap.appendChild(img1);

  img1.addEventListener('load', () => {
    gsap.set(img1, { xPercent: -50, yPercent: -50, scale: 5.35, opacity: 0 });
    gsap.to(img1, { duration: 1.7, scale: 1, opacity: 1, ease: 'power3.out' });
  }, { once: true });

  const textBox1 = document.createElement('h2');
  textBox1.className = 'cambodia-street-textbox-1';
  textBox1.textContent = 'Angkor Wat Statues';
  imagesWrap.appendChild(textBox1);

  gsap.set(textBox1, { xPercent: -50, yPercent: -190, opacity: 0 });
  gsap.to(textBox1, {
    duration: 1.1,
    xPercent: -50,
    yPercent: -50,
    opacity: 1,
    ease: 'power3.out',
    delay: 0.55,
  });
})();
