// assets/js/projects/forest/animatedImageRow.js
(() => {
  const sections = document.querySelectorAll('.slide-show-with-side-show-section');
  if (!sections.length) return;


  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const wrapIndex = (i, count) => ((i % count) + count) % count;
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const WHEEL_STEP_THRESHOLD = 100;
  const WHEEL_COOLDOWN_MS = 140;
  const BINOCULAR_ZOOM = 2;
  const MIN_BINOCULAR_SIZE = 72;
  const ARTICLE_CURSOR_SIZE = 76;
  const DESKTOP_MEDIA_QUERY = "(min-width: 601px)";

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
    const largeImageContainer = section.querySelector(".large-image-container");
    const thumbsWrap = section.querySelector(".slide-images-container");
    const galleryFrame = section.querySelector(".slide-show-with-side-show-images");
    const articlePanel = section.querySelector(".slide-show-article-panel");
    const articleTitleEl = section.querySelector(".slide-show-article-title");
    const articleIntroTitleEl = section.querySelector(".slide-show-article-intro-title");
    const articleIntroMainEl = section.querySelector(".slide-show-article-intro-main");
    const articleIntroSubEl = section.querySelector(".slide-show-article-intro-sub");
    const articleTextEl = section.querySelector(".slide-show-article-text");
    const articleExtraImagesEl = section.querySelector(".slide-show-article-extra-images");
    const articleCloseBtn = section.querySelector(".slide-show-article-close");
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
    const getArticleData = (src) => {
      const path = getImagePath(src);
      const fileName = getFileName(path);
      const entry = articleMap[path] || articleMap[fileName];
      return entry && typeof entry === "object" ? entry : null;
    };

    const renderArticle = (src) => {
      if (!articlePanel) return;

      const articleData = getArticleData(src) || {};
      const path = getImagePath(src);
      const fileName = getFileName(path);
      const readableName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Photo";
      const fullTitle = articleData.title || readableName;
      articlePanel.style.setProperty("--article-bg-image", `url("${src}")`);

      if (articleTitleEl) {
        articleTitleEl.textContent = fullTitle;
      }
      if (articleIntroTitleEl) {
        const commaParts = fullTitle.split(",").map((part) => part.trim()).filter(Boolean);
        let introMain = fullTitle;
        let introSub = "";
        if (commaParts.length >= 2) {
          introMain = commaParts[0];
          introSub = commaParts.slice(1).join(", ");
        } else {
          const words = fullTitle.trim().split(/\s+/);
          if (words.length > 1) {
            introMain = words.slice(0, -1).join(" ");
            introSub = words[words.length - 1];
          }
        }
        if (articleIntroMainEl) {
          articleIntroMainEl.textContent = introMain;
        }
        if (articleIntroSubEl) {
          articleIntroSubEl.textContent = introSub;
          articleIntroSubEl.hidden = !introSub;
        }
      }
      if (articleTextEl) {
        articleTextEl.textContent = articleData.story || getDescription(src) || "Add your story here.";
      }

      if (articleExtraImagesEl) {
        articleExtraImagesEl.innerHTML = "";
        const extra = Array.isArray(articleData.extra_images) ? articleData.extra_images : [];
        extra.forEach((imageData) => {
          const img = document.createElement("img");
          if (typeof imageData === "string") {
            img.src = imageData;
            img.alt = "";
          } else if (imageData && typeof imageData === "object" && imageData.src) {
            img.src = imageData.src;
            img.alt = imageData.alt || "";
          } else {
            return;
          }
          img.className = "images slide-show-article-extra-image";
          img.loading = "lazy";
          img.decoding = "async";
          articleExtraImagesEl.appendChild(img);
        });
      }
    };

    const desktopMq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const binocular = document.createElement("div");
    binocular.className = "binocular-cursor";
    binocular.setAttribute("aria-hidden", "true");

    const paneClasses = [
      "binocular-pane top-left",
      "binocular-pane top-right",
      "binocular-pane bottom-left",
      "binocular-pane bottom-right"
    ];
    const panes = paneClasses.map((className) => {
      const pane = document.createElement("div");
      pane.className = className;
      binocular.appendChild(pane);
      return pane;
    });
    const clickHint = document.createElement("span");
    clickHint.className = "binocular-click-hint";
    clickHint.textContent = "click";
    binocular.appendChild(clickHint);
    largeImageContainer.appendChild(binocular);

    const articleCursor = document.createElement("div");
    articleCursor.className = "article-binocular-cursor";
    articleCursor.setAttribute("aria-hidden", "true");
    const articlePanes = paneClasses.map((className) => {
      const pane = document.createElement("div");
      pane.className = `${className} article-binocular-pane`;
      articleCursor.appendChild(pane);
      return pane;
    });
    if (articlePanel) {
      articlePanel.appendChild(articleCursor);
    }

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

    const hideArticleCursor = () => {
      articleCursor.classList.remove("is-visible");
      if (articlePanel) {
        articlePanel.classList.remove("is-article-cursor-active");
      }
    };

    const updateArticleCursor = (event) => {
      if (!desktopMq.matches || !isArticleOpen || !articlePanel) {
        hideArticleCursor();
        return;
      }
      const rect = articlePanel.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        hideArticleCursor();
        return;
      }

      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const paneSize = ARTICLE_CURSOR_SIZE / 2;
      const quarter = ARTICLE_CURSOR_SIZE / 4;

      articleCursor.style.width = `${ARTICLE_CURSOR_SIZE}px`;
      articleCursor.style.height = `${ARTICLE_CURSOR_SIZE}px`;
      articleCursor.style.left = `${event.clientX - ARTICLE_CURSOR_SIZE / 2}px`;
      articleCursor.style.top = `${event.clientY - ARTICLE_CURSOR_SIZE / 2}px`;

      const bgSize = `${rect.width * BINOCULAR_ZOOM}px ${rect.height * BINOCULAR_ZOOM}px`;
      const imgUrl = `url("${largeImage.src}")`;
      const sourceOffsets = [
        { dx: quarter, dy: quarter },   // display TL gets source 2B
        { dx: -quarter, dy: quarter },  // display TR gets source 1B
        { dx: quarter, dy: -quarter },  // display BL gets source 2A
        { dx: -quarter, dy: -quarter }  // display BR gets source 1A
      ];

      articlePanes.forEach((pane, i) => {
        const sourceX = clamp(x + sourceOffsets[i].dx, 0, rect.width);
        const sourceY = clamp(y + sourceOffsets[i].dy, 0, rect.height);
        const posX = paneSize / 2 - sourceX * BINOCULAR_ZOOM;
        const posY = paneSize / 2 - sourceY * BINOCULAR_ZOOM;
        pane.style.width = `${paneSize}px`;
        pane.style.height = `${paneSize}px`;
        pane.style.backgroundImage = imgUrl;
        pane.style.backgroundSize = bgSize;
        pane.style.backgroundPosition = `${posX}px ${posY}px`;
      });

      articleCursor.classList.add("is-visible");
      articlePanel.classList.add("is-article-cursor-active");
    };

    let isArticleOpen = false;
    let introTimerId = null;
    const playArticleIntro = () => {
      if (!articlePanel) return;
      if (introTimerId) {
        clearTimeout(introTimerId);
      }
      articlePanel.classList.remove("is-intro-playing");
      void articlePanel.offsetWidth;
      articlePanel.classList.add("is-intro-playing");
      introTimerId = window.setTimeout(() => {
        articlePanel.classList.remove("is-intro-playing");
        introTimerId = null;
      }, 4250);
    };

    const openArticle = () => {
      if (!desktopMq.matches || !galleryFrame || !largeImage.src) return;
      renderArticle(largeImage.src);
      hideBinocular();
      galleryFrame.classList.add("is-article-open");
      isArticleOpen = true;
      playArticleIntro();
    };
    const closeArticle = () => {
      if (!galleryFrame) return;
      galleryFrame.classList.remove("is-article-open");
      isArticleOpen = false;
      if (introTimerId) {
        clearTimeout(introTimerId);
        introTimerId = null;
      }
      if (articlePanel) {
        articlePanel.classList.remove("is-intro-playing");
      }
      hideArticleCursor();
    };

    const updateBinocularPosition = (event) => {
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
        { dx: quarter, dy: quarter },   // display TL gets source 2B
        { dx: -quarter, dy: quarter },  // display TR gets source 1B
        { dx: quarter, dy: -quarter },  // display BL gets source 2A
        { dx: -quarter, dy: -quarter }  // display BR gets source 1A
      ];

      panes.forEach((pane, i) => {
        const sourceX = clamp(x + sourceOffsets[i].dx, 0, rect.width);
        const sourceY = clamp(y + sourceOffsets[i].dy, 0, rect.height);
        const posX = paneSize / 2 - sourceX * BINOCULAR_ZOOM;
        const posY = paneSize / 2 - sourceY * BINOCULAR_ZOOM;
        pane.style.width = `${paneSize}px`;
        pane.style.height = `${paneSize}px`;
        pane.style.backgroundSize = bgSize;
        pane.style.backgroundPosition = `${posX}px ${posY}px`;
      });

      binocular.classList.add("is-visible");
      largeImageContainer.classList.add("is-binocular-active");
    };

    largeImage.addEventListener("mouseenter", (event) => {
      updateBinocularImage();
      updateBinocularPosition(event);
    });
    largeImage.addEventListener("mousemove", updateBinocularPosition);
    largeImage.addEventListener("mouseleave", hideBinocular);
    largeImage.addEventListener("click", openArticle);
    binocular.addEventListener("click", openArticle);
    if (articlePanel) {
      articlePanel.addEventListener("mouseenter", updateArticleCursor);
      articlePanel.addEventListener("mousemove", updateArticleCursor);
      articlePanel.addEventListener("mouseleave", hideArticleCursor);
    }
    if (articleCloseBtn) {
      articleCloseBtn.addEventListener("click", closeArticle);
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isArticleOpen) {
        closeArticle();
      }
    });
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

    const setActive = (index, scrollIntoView = true, smoothScroll = true) => {
      const activeIndex = wrapIndex(index, thumbs.length);
      const activeThumb = thumbs[activeIndex];
      if (largeImage.src !== activeThumb.src) {
        largeImage.src = activeThumb.src;
        updateBinocularImage();
      }
      if (descriptionEl) {
        descriptionEl.textContent = getDescription(activeThumb.src);
      }
      if (isArticleOpen) {
        renderArticle(activeThumb.src);
        playArticleIntro();
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
