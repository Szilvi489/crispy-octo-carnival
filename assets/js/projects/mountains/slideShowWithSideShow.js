// assets/js/projects/forest/animatedImageRow.js
(() => {
  const sections = document.querySelectorAll('.slide-show-with-side-show-section');
  if (!sections.length) return;


  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const wrapIndex = (i, count) => ((i % count) + count) % count;
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const WHEEL_STEP_THRESHOLD = 100;
  const WHEEL_COOLDOWN_MS = 140;

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
    const descriptionEl = section.querySelector(".large-image-description");
    const thumbsWrap = section.querySelector(".slide-images-container");
    if (!largeImage || !thumbsWrap || !Array.isArray(data.all)) {
      return null;
    }
    const descriptionMap = data.descriptions && typeof data.descriptions === "object"
      ? data.descriptions
      : {};

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

    const getDescription = (src) => {
      let path = src || "";
      try {
        path = new URL(src, window.location.origin).pathname;
      } catch (error) {
        path = src || "";
      }
      const fileName = (path.split("/").pop() || "").trim();
      return descriptionMap[path] || descriptionMap[fileName] || "";
    };

    const centerThumb = (activeThumb, smooth = true) => {
      const containerRect = thumbsWrap.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();
      const offsetY = (thumbRect.top + thumbRect.height / 2)
        - (containerRect.top + containerRect.height / 2);
      const offsetX = (thumbRect.left + thumbRect.width / 2)
        - (containerRect.left + containerRect.width / 2);
      const top = thumbsWrap.scrollTop + offsetY;
      const left = thumbsWrap.scrollLeft + offsetX;

      if (smooth && typeof thumbsWrap.scrollTo === "function") {
        thumbsWrap.scrollTo({ top, left, behavior: "smooth" });
      } else {
        thumbsWrap.scrollTop = top;
        thumbsWrap.scrollLeft = left;
      }
    };

    const setActive = (index, scrollIntoView = true, smoothScroll = true) => {
      const activeIndex = wrapIndex(index, thumbs.length);
      const activeThumb = thumbs[activeIndex];
      if (largeImage.src !== activeThumb.src) {
        largeImage.src = activeThumb.src;
      }
      if (descriptionEl) {
        descriptionEl.textContent = getDescription(activeThumb.src);
      }
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle("is-active", i === activeIndex);
      });
      if (scrollIntoView) {
        centerThumb(activeThumb, smoothScroll);
      } else {
        centerThumb(activeThumb, false);
      }
    };

    let currentIndex = 0;
    let wheelAccum = 0;
    let lastWheelStepAt = 0;
    setActive(currentIndex, false);

    const onWheel = (event) => {
      const deltaBase = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      if (deltaBase === 0) return;

      // Normalize delta so line/page wheel modes are comparable to pixels.
      const modeScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
      const delta = deltaBase * modeScale;
      if (delta === 0) return;
      event.preventDefault();

      const now = performance.now();
      const prevWheelAccum = wheelAccum;
      wheelAccum += delta;

      // If direction changes, keep only the fresh direction's momentum.
      if ((prevWheelAccum > 0 && delta < 0) || (prevWheelAccum < 0 && delta > 0)) {
        wheelAccum = delta;
      }

      if (Math.abs(wheelAccum) < WHEEL_STEP_THRESHOLD) return;
      if (now - lastWheelStepAt < WHEEL_COOLDOWN_MS) return;

      const step = wheelAccum > 0 ? 1 : -1;
      const nextIndex = wrapIndex(currentIndex + step, thumbs.length);
      const isWrappingForward = currentIndex === thumbs.length - 1 && step === 1;
      const isWrappingBackward = currentIndex === 0 && step === -1;
      const isWrapping = isWrappingForward || isWrappingBackward;
      currentIndex = nextIndex;
      setActive(currentIndex, true, !isWrapping);
      lastWheelStepAt = now;
      wheelAccum = 0;
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener("click", () => {
        currentIndex = i;
        setActive(currentIndex, true);
      });
    });

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
