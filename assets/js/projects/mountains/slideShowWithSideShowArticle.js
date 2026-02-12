(() => {
  const BINOCULAR_ZOOM = 2;
  const ARTICLE_CURSOR_SIZE = 76;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  window.setupSlideShowWithSideShowArticle = ({
    section,
    data,
    largeImage,
    binocular,
    desktopMq,
    getDescription
  }) => {
    const galleryFrame = section.querySelector(".slide-show-with-side-show-images");
    const articlePanel = section.querySelector(".slide-show-article-panel");
    const articleTitleEl = section.querySelector(".slide-show-article-title");
    const articleIntroTitleEl = section.querySelector(".slide-show-article-intro-title");
    const articleIntroMainEl = section.querySelector(".slide-show-article-intro-main");
    const articleIntroSubEl = section.querySelector(".slide-show-article-intro-sub");
    const articleTextEl = section.querySelector(".slide-show-article-text");
    const articleExtraImagesEl = section.querySelector(".slide-show-article-extra-images");
    const articleCloseBtn = section.querySelector(".slide-show-article-close");
    const articleMap = data.articles && typeof data.articles === "object"
      ? data.articles
      : {};

    if (!galleryFrame || !articlePanel || !largeImage || !desktopMq) {
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
    const getArticleData = (src) => {
      const path = getImagePath(src);
      const fileName = getFileName(path);
      const entry = articleMap[path] || articleMap[fileName];
      return entry && typeof entry === "object" ? entry : null;
    };

    const renderArticle = (src) => {
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

    const clickHint = document.createElement("span");
    clickHint.className = "binocular-click-hint";
    clickHint.textContent = "click";
    if (binocular) {
      binocular.appendChild(clickHint);
    }

    const paneClasses = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right"
    ];
    const articleCursor = document.createElement("div");
    articleCursor.className = "article-binocular-cursor";
    articleCursor.setAttribute("aria-hidden", "true");
    const articlePanes = paneClasses.map((positionClass) => {
      const pane = document.createElement("div");
      pane.className = `${positionClass} article-binocular-pane`;
      articleCursor.appendChild(pane);
      return pane;
    });
    articlePanel.appendChild(articleCursor);

    const hideArticleCursor = () => {
      articleCursor.classList.remove("is-visible");
      articlePanel.classList.remove("is-article-cursor-active");
    };

    let isArticleOpen = false;
    let introTimerId = null;
    const playArticleIntro = () => {
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

    const updateArticleCursor = (event) => {
      if (!desktopMq.matches || !isArticleOpen) {
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
        { dx: quarter, dy: quarter },
        { dx: -quarter, dy: quarter },
        { dx: quarter, dy: -quarter },
        { dx: -quarter, dy: -quarter }
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

    const openArticle = () => {
      if (!desktopMq.matches || !largeImage.src) return;
      renderArticle(largeImage.src);
      galleryFrame.classList.add("is-article-open");
      isArticleOpen = true;
      playArticleIntro();
    };

    const closeArticle = () => {
      galleryFrame.classList.remove("is-article-open");
      isArticleOpen = false;
      if (introTimerId) {
        clearTimeout(introTimerId);
        introTimerId = null;
      }
      articlePanel.classList.remove("is-intro-playing");
      hideArticleCursor();
    };

    largeImage.addEventListener("click", openArticle);
    if (binocular) {
      binocular.addEventListener("click", openArticle);
    }
    if (articleCloseBtn) {
      articleCloseBtn.addEventListener("click", closeArticle);
    }
    articlePanel.addEventListener("mouseenter", updateArticleCursor);
    articlePanel.addEventListener("mousemove", updateArticleCursor);
    articlePanel.addEventListener("mouseleave", hideArticleCursor);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isArticleOpen) {
        closeArticle();
      }
    });
    window.addEventListener("resize", hideArticleCursor);

    return {
      onImageChange: (src) => {
        if (!isArticleOpen) return;
        renderArticle(src);
        playArticleIntro();
      }
    };
  };
})();
