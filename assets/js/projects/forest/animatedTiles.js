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
    const overlay = section.querySelector(".animated-tiles-overlay");
    let overlayImage = section.querySelector(".animated-tiles-overlay-image");
    const closeButton = section.querySelector(".animated-tiles-close");
    if (!imagesWrap || !Array.isArray(data.all)) {
      return;
    }
    if (overlay && !overlayImage) {
      overlayImage = document.createElement("img");
      overlayImage.className = "animated-tiles-overlay-image";
      overlayImage.alt = "";
      overlayImage.loading = "lazy";
      overlayImage.decoding = "async";
      overlay.appendChild(overlayImage);
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

    if (overlay && overlayImage && closeButton) {
      const openOverlay = (src) => {
        overlayImage.src = src;
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("tiles-overlay-open");
      };

      const closeOverlay = () => {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        overlayImage.src = "";
        document.documentElement.classList.remove("tiles-overlay-open");
      };

      imagesWrap.addEventListener("click", (event) => {
        const target = event.target;
        if (target && target.tagName === "IMG") {
          openOverlay(target.currentSrc || target.src);
        }
      });

      closeButton.addEventListener("click", closeOverlay);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          closeOverlay();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeOverlay();
        }
      });
    }
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
