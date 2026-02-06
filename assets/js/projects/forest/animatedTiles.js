// assets/js/projects/forest/animatedImageRow.js
(() => {
  const sections = document.querySelectorAll('.animated-tiles-section');
  if (!sections.length) return;


  sections.forEach((section) => {
    const dataEl = section.querySelector(".forest-gallery-data");
    if (!dataEl) {
      return;
    }

    let data;
    try {
      data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
      console.error("Animated tiles: invalid JSON", error);
      return;
    }

    console.log("Animated tiles data:", data);

    const imagesWrap = section.querySelector(".animated-tiles-images");
    if (!imagesWrap || !Array.isArray(data.all)) {
      return;
    }

    imagesWrap.innerHTML = "";
    data.all.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.className = "images";
      imagesWrap.appendChild(img);
    });
  });

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
