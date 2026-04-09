(() => {
  const sections = document.querySelectorAll(".slide-show-with-side-show-section");
  if (!sections.length) return;

  const gsapApi = window.gsap;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const wrapIndex = (index, count) => ((index % count) + count) % count;
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const WHEEL_STEP_THRESHOLD = 100;
  const WHEEL_COOLDOWN_MS = 140;
  const BINOCULAR_ZOOM = 2;
  const MIN_BINOCULAR_SIZE = 72;
  const DESKTOP_MEDIA_QUERY = "(min-width: 601px)";
  const IMAGE_FADE_OUT_DURATION = 0.18;
  const IMAGE_FADE_IN_DURATION = 0.34;
  const COPY_FADE_DURATION = 0.18;
  const THUMB_DURATION = 0.24;

  const hasGsap = !!(gsapApi && typeof gsapApi.to === "function" && typeof gsapApi.set === "function");

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

    let largeImage = section.querySelector(".large-image");
    const descriptionEl = section.querySelector(".large-image-description");
    const mobileTitleEl = section.querySelector(".large-image-mobile-title");
    const largeImageContainer = section.querySelector(".large-image-container");
    const thumbsWrap = section.querySelector(".slide-images-container");
    const galleryFrame = section.querySelector(".slide-show-with-side-show-images");
    if (!largeImage && largeImageContainer) {
      largeImage = document.createElement("img");
      largeImage.className = "images large-image";
      largeImage.alt = "";
      largeImage.loading = "lazy";
      largeImage.decoding = "async";
      largeImageContainer.appendChild(largeImage);
    }

    if (!largeImage || !largeImageContainer || !thumbsWrap || !Array.isArray(data.all)) {
      return null;
    }

    const descriptionMap = data.descriptions && typeof data.descriptions === "object"
      ? data.descriptions
      : {};
    const articleMap = data.articles && typeof data.articles === "object"
      ? data.articles
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

    const getImagePath = (src) => {
      let path = src || "";
      try {
        path = new URL(src, window.location.origin).pathname;
      } catch (error) {
        path = src || "";
      }
      return path;
    };

    const getFileName = (path) => (path.split("/").pop() || "").trim();

    const getDescription = (src) => {
      const path = getImagePath(src);
      const fileName = getFileName(path);
      return descriptionMap[path] || descriptionMap[fileName] || "";
    };

    const getTitle = (src) => {
      const path = getImagePath(src);
      const fileName = getFileName(path);
      const article = articleMap[path] || articleMap[fileName];
      if (article && typeof article === "object" && typeof article.title === "string") {
        return article.title;
      }
      return "";
    };

    const desktopMq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const binocular = document.createElement("div");
    binocular.className = "binocular-cursor";
    binocular.setAttribute("aria-hidden", "true");

    const panes = [
      "binocular-pane top-left",
      "binocular-pane top-right",
      "binocular-pane bottom-left",
      "binocular-pane bottom-right"
    ].map((className) => {
      const pane = document.createElement("div");
      pane.className = className;
      binocular.appendChild(pane);
      return pane;
    });
    largeImageContainer.appendChild(binocular);

    const updateBinocularImage = () => {
      const imgUrl = `url("${largeImage.src}")`;
      panes.forEach((pane) => {
        pane.style.backgroundImage = imgUrl;
      });
    };

    const hideBinocular = () => {
      binocular.classList.remove("is-visible");
      largeImageContainer.classList.remove("is-binocular-active");
    };

    const articleController = typeof window.setupSlideShowWithSideShowArticle === "function"
      ? window.setupSlideShowWithSideShowArticle({
        section,
        data,
        largeImage,
        binocular,
        hideBinocular,
        desktopMq,
        getDescription
      })
      : null;

    const updateBinocularPosition = (event) => {
      if (galleryFrame && galleryFrame.classList.contains("is-article-open")) {
        hideBinocular();
        return;
      }
      if (!desktopMq.matches || !largeImage.src) {
        hideBinocular();
        return;
      }

      const rect = largeImage.getBoundingClientRect();
      const containerRect = largeImageContainer.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        hideBinocular();
        return;
      }

      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const lensSize = Math.max(
        MIN_BINOCULAR_SIZE,
        Math.min(rect.width, rect.height) / 8
      );
      const paneSize = lensSize / 2;
      const quarter = lensSize / 4;

      binocular.style.width = `${lensSize}px`;
      binocular.style.height = `${lensSize}px`;
      binocular.style.left = `${rect.left - containerRect.left + x - lensSize / 2}px`;
      binocular.style.top = `${rect.top - containerRect.top + y - lensSize / 2}px`;

      const bgSize = `${rect.width * BINOCULAR_ZOOM}px ${rect.height * BINOCULAR_ZOOM}px`;
      const sourceOffsets = [
        { dx: quarter, dy: quarter },
        { dx: -quarter, dy: quarter },
        { dx: quarter, dy: -quarter },
        { dx: -quarter, dy: -quarter }
      ];

      panes.forEach((pane, index) => {
        const sourceX = clamp(x + sourceOffsets[index].dx, 0, rect.width);
        const sourceY = clamp(y + sourceOffsets[index].dy, 0, rect.height);
        const posX = paneSize / 2 - sourceX * BINOCULAR_ZOOM;
        const posY = paneSize / 2 - sourceY * BINOCULAR_ZOOM;
        pane.style.width = `${paneSize}px`;
        pane.style.height = `${paneSize}px`;
        pane.style.backgroundSize = bgSize;
        pane.style.backgroundPosition = `${posX}px ${posY}px`;
      });

      binocular.style.removeProperty("display");
      binocular.style.removeProperty("visibility");
      binocular.style.removeProperty("opacity");
      binocular.classList.add("is-visible");
      largeImageContainer.classList.add("is-binocular-active");
    };

    largeImage.addEventListener("mouseenter", (event) => {
      updateBinocularImage();
      updateBinocularPosition(event);
    });
    largeImage.addEventListener("mousemove", updateBinocularPosition);
    largeImage.addEventListener("mouseleave", hideBinocular);
    window.addEventListener("resize", hideBinocular);

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

    const animateCopyText = (element, nextText, animate) => {
      if (!element) return;
      const resolvedText = nextText || "";
      if (element.dataset.currentText === resolvedText) {
        return;
      }
      element.dataset.currentText = resolvedText;

      if (!hasGsap || !animate) {
        element.textContent = resolvedText;
        return;
      }

      gsapApi.killTweensOf(element);
      const timeline = gsapApi.timeline();
      timeline.to(element, {
        autoAlpha: 0,
        y: 6,
        duration: COPY_FADE_DURATION * 0.7,
        ease: "power1.out",
        overwrite: "auto"
      });
      timeline.add(() => {
        element.textContent = resolvedText;
      });
      timeline.to(element, {
        autoAlpha: 1,
        y: 0,
        duration: COPY_FADE_DURATION,
        ease: "power2.out",
        overwrite: "auto"
      });
    };

    let imageSwapToken = 0;
    const setLargeImageSource = (nextSrc, animate) => {
      if (!nextSrc) return;
      const token = ++imageSwapToken;
      const revealImage = () => {
        if (token !== imageSwapToken) return;
        updateBinocularImage();
        if (!hasGsap || !animate) {
          if (hasGsap) {
            gsapApi.set(largeImage, { autoAlpha: 1, y: 0, scale: 1 });
          }
          return;
        }
        gsapApi.set(largeImage, { autoAlpha: 0, y: 10, scale: 0.985 });
        gsapApi.to(largeImage, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: IMAGE_FADE_IN_DURATION,
          ease: "power2.out",
          overwrite: "auto"
        });
      };

      if (largeImage.src === nextSrc) {
        revealImage();
        return;
      }

      const applyNextSource = () => {
        if (token !== imageSwapToken) return;
        largeImage.src = nextSrc;
        if (largeImage.complete) {
          revealImage();
        } else {
          largeImage.addEventListener("load", revealImage, { once: true });
        }
      };

      if (!hasGsap || !animate) {
        applyNextSource();
        return;
      }

      gsapApi.killTweensOf(largeImage);
      gsapApi.to(largeImage, {
        autoAlpha: 0,
        y: -8,
        scale: 1.01,
        duration: IMAGE_FADE_OUT_DURATION,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: applyNextSource
      });
    };

    const updateThumbState = (activeIndex, animate) => {
      thumbs.forEach((thumb, index) => {
        const isActive = index === activeIndex;
        thumb.classList.toggle("is-active", isActive);
        if (!hasGsap) {
          return;
        }
        gsapApi.to(thumb, {
          opacity: isActive ? 1 : 0.5,
          scale: isActive ? 1.02 : 0.98,
          boxShadow: isActive
            ? "0 6px 16px rgba(0, 0, 0, 0.35)"
            : "0 0 0 rgba(0, 0, 0, 0)",
          duration: animate ? THUMB_DURATION : 0,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    };

    if (hasGsap) {
      gsapApi.set(largeImage, { autoAlpha: 1, y: 0, scale: 1 });
      gsapApi.set([descriptionEl, mobileTitleEl], { autoAlpha: 1, y: 0 });
    }

    let renderedIndex = -1;
    const setActive = (index, scrollIntoView = true, smoothScroll = true) => {
      const activeIndex = wrapIndex(index, thumbs.length);
      const activeThumb = thumbs[activeIndex];
      const isInitial = renderedIndex < 0;
      const hasChanged = activeIndex !== renderedIndex;

      if (hasChanged) {
        setLargeImageSource(activeThumb.src, !isInitial);
        const nextDescription = getDescription(activeThumb.src);
        animateCopyText(descriptionEl, nextDescription, !isInitial);
        animateCopyText(
          mobileTitleEl,
          getTitle(activeThumb.src) || nextDescription,
          !isInitial
        );
        if (articleController && typeof articleController.onImageChange === "function") {
          articleController.onImageChange(activeThumb.src);
        }
        section.dispatchEvent(new CustomEvent("slideshow:indexchange", {
          detail: {
            index: activeIndex + 1,
            total: thumbs.length
          }
        }));
      }

      updateThumbState(activeIndex, !isInitial);

      if (scrollIntoView) {
        centerThumb(activeThumb, smoothScroll);
      } else {
        centerThumb(activeThumb, false);
      }

      renderedIndex = activeIndex;
    };

    let currentIndex = 0;
    let wheelAccum = 0;
    let lastWheelStepAt = 0;
    setActive(currentIndex, false, false);

    const onWheel = (event) => {
      if (galleryFrame && galleryFrame.classList.contains("is-article-open")) {
        return;
      }

      const deltaBase = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      if (deltaBase === 0) return;

      const modeScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
      const delta = deltaBase * modeScale;
      if (delta === 0) return;

      event.preventDefault();

      const now = performance.now();
      const prevWheelAccum = wheelAccum;
      wheelAccum += delta;

      if ((prevWheelAccum > 0 && delta < 0) || (prevWheelAccum < 0 && delta > 0)) {
        wheelAccum = delta;
      }

      if (Math.abs(wheelAccum) < WHEEL_STEP_THRESHOLD) return;
      if (now - lastWheelStepAt < WHEEL_COOLDOWN_MS) return;

      const step = wheelAccum > 0 ? 1 : -1;
      const nextIndex = wrapIndex(currentIndex + step, thumbs.length);
      const isWrappingForward = currentIndex === thumbs.length - 1 && step === 1;
      const isWrappingBackward = currentIndex === 0 && step === -1;
      currentIndex = nextIndex;
      setActive(currentIndex, true, !(isWrappingForward || isWrappingBackward));
      lastWheelStepAt = now;
      wheelAccum = 0;
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    thumbs.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        currentIndex = index;
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

    instances.forEach(({ section, setActive, count }) => {
      const rect = section.getBoundingClientRect();
      const raw = rect.top <= 0 ? (-rect.top / (rect.height || 1)) : 0;
      const t = smoothstep(clamp(raw, 0, 1));
      const index = Math.floor(t * (count - 1 + 0.0001));
      setActive(index, false);
      section.style.setProperty("--t", t.toFixed(4));
    });
  };

  const onScroll = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);
  update();
})();
