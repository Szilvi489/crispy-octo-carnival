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
    const timeValueEl = section.querySelector('[data-meta="time"]');
    const weatherValueEl = section.querySelector('[data-meta="field2"]');
    const flagValueEl = section.querySelector('[data-meta="field3"]');
    const countryValueEl = section.querySelector('[data-meta="field4"]');
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
    const isValidTimeZone = (timeZone) => {
      if (!timeZone || typeof timeZone !== "string") return false;
      try {
        new Intl.DateTimeFormat("en-GB", { timeZone }).format(new Date());
        return true;
      } catch (error) {
        return false;
      }
    };
    const weatherCodeMap = {
      0: "Clear",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Dense drizzle",
      56: "Freezing drizzle",
      57: "Heavy freezing drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      66: "Freezing rain",
      67: "Heavy freezing rain",
      71: "Light snow",
      73: "Snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Rain showers",
      81: "Rain showers",
      82: "Violent showers",
      85: "Snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm hail",
      99: "Severe thunderstorm hail"
    };

    let currentTimeZone = "";
    let currentLatitude = null;
    let currentLongitude = null;
    let currentCountryCode = "";
    let timeTimerId = null;
    const weatherCache = new Map();
    const countryCache = new Map();
    const updateLiveTime = () => {
      if (!timeValueEl) return;
      if (!isValidTimeZone(currentTimeZone)) {
        timeValueEl.textContent = "Add timezone";
        return;
      }
      const timeText = new Intl.DateTimeFormat("en-GB", {
        timeZone: currentTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
      timeValueEl.textContent = timeText;
    };
    const startLiveTime = () => {
      if (timeTimerId) clearInterval(timeTimerId);
      updateLiveTime();
      timeTimerId = window.setInterval(updateLiveTime, 1000);
    };
    const stopLiveTime = () => {
      if (timeTimerId) {
        clearInterval(timeTimerId);
        timeTimerId = null;
      }
    };
    const toNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    const updateWeather = async () => {
      if (!weatherValueEl) return;
      if (!Number.isFinite(currentLatitude) || !Number.isFinite(currentLongitude)) {
        weatherValueEl.textContent = "Add coordinates";
        return;
      }

      const key = `${currentLatitude.toFixed(4)},${currentLongitude.toFixed(4)}`;
      const cached = weatherCache.get(key);
      const now = Date.now();
      if (cached && now - cached.ts < 5 * 60 * 1000) {
        weatherValueEl.textContent = cached.value;
        return;
      }

      weatherValueEl.textContent = "Loading...";
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(currentLatitude)}&longitude=${encodeURIComponent(currentLongitude)}&current=temperature_2m,weather_code`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          throw new Error(`Weather fetch failed with ${response.status}`);
        }
        const json = await response.json();
        const current = json && json.current ? json.current : null;
        const temp = current && typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null;
        const code = current && typeof current.weather_code === "number" ? current.weather_code : null;
        if (temp == null || code == null) {
          throw new Error("Weather payload missing fields");
        }
        const condition = weatherCodeMap[code] || "Weather";
        const text = `${temp}C - ${condition}`;
        weatherCache.set(key, { ts: now, value: text });
        weatherValueEl.textContent = text;
      } catch (error) {
        weatherValueEl.textContent = "Weather unavailable";
      }
    };
    const updateCountryInfo = async () => {
      if (!countryValueEl) return;
      const code = (currentCountryCode || "").trim().toLowerCase();
      if (!/^[a-z]{2}$/.test(code)) {
        countryValueEl.textContent = "Add country code";
        return;
      }

      if (countryCache.has(code)) {
        countryValueEl.textContent = countryCache.get(code);
        return;
      }

      countryValueEl.textContent = "Loading...";
      try {
        const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}?fields=capital,region,subregion`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          throw new Error(`Country fetch failed with ${response.status}`);
        }
        const payload = await response.json();
        const country = Array.isArray(payload) ? payload[0] : payload;
        const capital = country && Array.isArray(country.capital) && country.capital[0]
          ? country.capital[0]
          : null;
        const region = country && typeof country.subregion === "string" && country.subregion
          ? country.subregion
          : (country && typeof country.region === "string" ? country.region : null);
        const value = [capital, region].filter(Boolean).join(" - ") || "Unavailable";
        countryCache.set(code, value);
        countryValueEl.textContent = value;
      } catch (error) {
        countryValueEl.textContent = "Unavailable";
      }
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

      currentTimeZone = typeof articleData.timezone === "string" ? articleData.timezone : "";
      updateLiveTime();
      currentLatitude = toNumber(articleData.latitude);
      currentLongitude = toNumber(articleData.longitude);
      void updateWeather();
      currentCountryCode = typeof articleData.country_code === "string" ? articleData.country_code : "";
      void updateCountryInfo();

      if (flagValueEl) {
        const codeRaw = typeof articleData.country_code === "string" ? articleData.country_code : "";
        const code = codeRaw.trim().toLowerCase();
        flagValueEl.innerHTML = "";
        if (/^[a-z]{2}$/.test(code)) {
          const flag = document.createElement("span");
          flag.className = `fi fi-${code}`;
          flag.setAttribute("aria-label", `Flag ${code.toUpperCase()}`);
          flagValueEl.appendChild(flag);
        }
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
      startLiveTime();
      playArticleIntro();
    };

    const closeArticle = () => {
      galleryFrame.classList.remove("is-article-open");
      isArticleOpen = false;
      stopLiveTime();
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
        startLiveTime();
        playArticleIntro();
      }
    };
  };
})();
