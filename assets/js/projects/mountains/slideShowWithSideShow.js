// assets/js/projects/forest/animatedImageRow.js
(() => {
  const sections = document.querySelectorAll('.slide-show-with-side-show-section');
  if (!sections.length) return;


  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  const setupSection = (section) => {
    const dataEl = section.querySelector(".mountains-gallery-data");
    if (!dataEl) {
      return null;
    }

    let data;
    try {
      data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
      console.error("Slide show with a side show: invalid JSON", error);
      return null;
    }

    const largeImage = section.querySelector(".large-image");
    const thumbsWrap = section.querySelector(".slide-images-container");
    if (!largeImage || !thumbsWrap || !Array.isArray(data.all)) {
      return null;
    }

    let thumbs = Array.from(thumbsWrap.querySelectorAll(".slide-images"));
    if (!thumbs.length) {
      thumbsWrap.innerHTML = "";
      data.all.forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.className = "images slide-images";
        thumbsWrap.appendChild(img);
      });
      thumbs = Array.from(thumbsWrap.querySelectorAll(".slide-images"));
    }

    if (!thumbs.length) {
      return null;
    }

    const setActive = (index, scrollIntoView = true) => {
      const clamped = clamp(index, 0, thumbs.length - 1);
      const activeThumb = thumbs[clamped];
      if (largeImage.src !== activeThumb.src) {
        largeImage.src = activeThumb.src;
      }
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle("is-active", i === clamped);
      });
      if (scrollIntoView) {
        const containerRect = thumbsWrap.getBoundingClientRect();
        const thumbRect = activeThumb.getBoundingClientRect();
        const offset = (thumbRect.top + thumbRect.height / 2)
          - (containerRect.top + containerRect.height / 2);
        thumbsWrap.scrollTop += offset;
      }
    };

    let currentIndex = 0;
    setActive(currentIndex, false);

    const onWheel = (event) => {
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      if (delta === 0) return;
      event.preventDefault();
      const step = delta > 0 ? 1 : -1;
      currentIndex = clamp(currentIndex + step, 0, thumbs.length - 1);
      setActive(currentIndex, true);
    };

    section.addEventListener("wheel", onWheel, { passive: false });

    return { section, setActive, count: thumbs.length };
  };

  const instances = Array.from(sections)
    .map(setupSection)
    .filter(Boolean);

  if (!instances.length) {
    return;
  }

  let rafId = null;
  const update = () => {
    rafId = null;
    const vh = window.innerHeight || 1;

    instances.forEach(({ section, setActive, count }) => {
      const rect = section.getBoundingClientRect();
      // Start changing only after the section is fully in view.
      const raw = rect.top <= 0 ? (-rect.top / (rect.height || 1)) : 0;
      const t = smoothstep(clamp(raw, 0, 1));
      const index = Math.floor(t * (count - 1 + 0.0001));
      setActive(index, false);
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
