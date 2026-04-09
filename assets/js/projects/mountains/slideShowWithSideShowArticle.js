(() => {
  const gsapApi = window.gsap;
  const hasGsap = !!(gsapApi && typeof gsapApi.timeline === "function" && typeof gsapApi.to === "function");
  const META_OFFSETS = [-140, 140, -140, 140];

  const buildClipPath = (topBottom, side, radius) => (
    `inset(${topBottom} ${side} ${topBottom} ${side} round ${radius})`
  );

  window.setupSlideShowWithSideShowArticle = ({
    section,
    data,
    largeImage,
    binocular,
    hideBinocular,
    desktopMq,
    getDescription
  }) => {
    const galleryFrame = section.querySelector(".slide-show-with-side-show-images");
    const descriptionEl = section.querySelector(".large-image-description");
    const largeImageContainer = section.querySelector(".large-image-container");
    const thumbsWrap = section.querySelector(".slide-images-container");
    const articlePanel = section.querySelector(".slide-show-article-panel");
    const articleContentEl = section.querySelector(".slide-show-article-content");
    const articleTitleEl = section.querySelector(".slide-show-article-title");
    const articleIntroTitleEl = section.querySelector(".slide-show-article-intro-title");
    const articleIntroMainEl = section.querySelector(".slide-show-article-intro-main");
    const articleIntroSubEl = section.querySelector(".slide-show-article-intro-sub");
    const articleTextEl = section.querySelector(".slide-show-article-text");
    const articleExtraImagesEl = section.querySelector(".slide-show-article-extra-images");
    const articleMetaBoxEl = section.querySelector(".slide-show-article-content-box2");
    const articleContainerAEl = section.querySelector(".slide-show-article-container-a");
    const articleContainerBEl = section.querySelector(".slide-show-article-container-b");
    const articleContainerCEl = section.querySelector(".slide-show-article-container-c");
    const articleContentBox3El = section.querySelector(".slide-show-article-content-box3");
    const articleMapImageWrapEl = section.querySelector(".slide-show-article-container-a");
    let articleMapImageEl = section.querySelector(".slide-show-article-map-image");
    const articleCloseBtn = section.querySelector(".slide-show-article-close");
    const timeValueEl = section.querySelector('[data-meta="time"]');
    const weatherValueEl = section.querySelector('[data-meta="field2"]');
    const flagValueEl = section.querySelector('[data-meta="field3"]');
    const countryValueEl = section.querySelector('[data-meta="field4"]');
    const localNameEl = section.querySelector(".local-name");
    const articleMap = data.articles && typeof data.articles === "object"
      ? data.articles
      : {};
    const metaItems = Array.from(section.querySelectorAll(".slide-show-article-meta-item"));
    const articleContentChildren = articleContentEl ? Array.from(articleContentEl.children) : [];
    const frameTargets = [descriptionEl, largeImageContainer, thumbsWrap].filter(Boolean);

    if (!articleMapImageEl && articleMapImageWrapEl) {
      articleMapImageEl = document.createElement("img");
      articleMapImageEl.className = "slide-show-article-map-image";
      articleMapImageEl.alt = "";
      articleMapImageEl.loading = "lazy";
      articleMapImageEl.decoding = "async";
      articleMapImageWrapEl.appendChild(articleMapImageEl);
    }

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

    const resolveMapImageSrc = (mapImageName) => {
      if (!mapImageName || typeof mapImageName !== "string") return "";
      const trimmed = mapImageName.trim();
      if (!trimmed) return "";
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
        return trimmed;
      }
      return `/assets/images/projects/mountains/maps/${trimmed}`;
    };

    const getArticleData = (src) => {
      const path = getImagePath(src);
      const fileName = getFileName(path);
      const entry = articleMap[path] || articleMap[fileName];
      return entry && typeof entry === "object" ? entry : null;
    };

    const getLocalName = (articleData) => {
      const localName = articleData?.local_name;
      return typeof localName === "string" && localName.trim() ? localName.trim() : "";
    };

    const getClipStates = () => {
      const styles = window.getComputedStyle(articlePanel);
      const startTb = styles.getPropertyValue("--article-unfold-start-tb").trim() || "40.6%";
      const startSide = styles.getPropertyValue("--article-unfold-start-side").trim() || "48%";
      const holdTb = styles.getPropertyValue("--article-unfold-hold-tb").trim() || "49.4%";
      const holdSide = styles.getPropertyValue("--article-unfold-hold-side").trim() || "5%";
      const midTb = styles.getPropertyValue("--article-unfold-mid-tb").trim() || "46.5%";
      const midSide = styles.getPropertyValue("--article-unfold-mid-side").trim() || "3%";
      return {
        start: buildClipPath(startTb, startSide, "999px"),
        hold: buildClipPath(holdTb, holdSide, "999px"),
        mid: buildClipPath(midTb, midSide, "16px"),
        end: "inset(0% 0% 0% 0% round 0px)"
      };
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
      0: "Clear ☀️",
      1: "Mainly clear 🌤️",
      2: "Partly cloudy ⛅",
      3: "Overcast ☁️",
      45: "Fog 🌫️",
      48: "Rime fog 🌫️",
      51: "Light drizzle 🌦️",
      53: "Drizzle 🌦️",
      55: "Dense drizzle 🌧️",
      56: "Freezing drizzle 🧊",
      57: "Heavy freezing drizzle 🧊",
      61: "Light rain 🌦️",
      63: "Rain 🌧️",
      65: "Heavy rain 🌧️",
      66: "Freezing rain 🧊",
      67: "Heavy freezing rain 🧊",
      71: "Light snow 🌨️",
      73: "Snow ❄️",
      75: "Heavy snow ❄️",
      77: "Snow grains ❄️",
      80: "Rain showers 🌦️",
      81: "Rain showers 🌦️",
      82: "Violent showers ⛈️",
      85: "Snow showers 🌨️",
      86: "Heavy snow showers 🌨️",
      95: "Thunderstorm ⛈️",
      96: "Thunderstorm hail ⛈️",
      99: "Severe thunderstorm hail ⛈️"
    };

    let currentTimeZone = "";
    let currentLatitude = null;
    let currentLongitude = null;
    let currentCountryCode = "";
    let timeTimerId = null;
    let metaRevealRafId = null;
    let isArticleOpen = false;
    let hasMetaRevealed = false;
    let containersExited = false;
    let box3Revealed = false;
    let articleIntroTimeline = null;
    let articleCloseTimeline = null;
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
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
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

    const setFrameOpenState = (open, immediate = false) => {
      if (!hasGsap) return;
      const duration = immediate ? 0 : 0.42;
      frameTargets.forEach((target) => {
        gsapApi.killTweensOf(target);
      });
      if (descriptionEl) {
        gsapApi.to(descriptionEl, {
          xPercent: open ? -130 : 0,
          autoAlpha: open ? 0 : 1,
          duration,
          ease: "power2.inOut",
          overwrite: "auto"
        });
      }
      if (largeImageContainer) {
        gsapApi.to(largeImageContainer, {
          xPercent: open ? -24 : 0,
          autoAlpha: open ? 0 : 1,
          duration,
          ease: "power2.inOut",
          overwrite: "auto"
        });
      }
      if (thumbsWrap) {
        gsapApi.to(thumbsWrap, {
          xPercent: open ? 130 : 0,
          autoAlpha: open ? 0 : 1,
          duration,
          ease: "power2.inOut",
          overwrite: "auto"
        });
      }
      gsapApi.set(frameTargets, {
        pointerEvents: open ? "none" : "auto"
      });
    };

    const resetRevealStates = () => {
      hasMetaRevealed = false;
      containersExited = false;
      box3Revealed = false;

      if (!hasGsap) {
        if (articleMetaBoxEl) {
          articleMetaBoxEl.classList.remove("is-visible");
          articleMetaBoxEl.classList.remove("is-past-mid");
        }
        if (articleContentBox3El) {
          articleContentBox3El.classList.remove("is-revealed");
        }
        return;
      }

      if (articleMetaBoxEl) {
        articleMetaBoxEl.classList.remove("is-visible");
        articleMetaBoxEl.classList.remove("is-past-mid");
      }
      if (articleContentBox3El) {
        articleContentBox3El.classList.remove("is-revealed");
      }
      gsapApi.set(metaItems, {
        autoAlpha: 0,
        x: (index) => META_OFFSETS[index] || 0
      });
      if (articleContainerAEl) {
        gsapApi.set(articleContainerAEl, { xPercent: 0, autoAlpha: 1 });
      }
      if (articleContainerBEl) {
        gsapApi.set(articleContainerBEl, { xPercent: 0, autoAlpha: 1 });
      }
      if (articleContentBox3El) {
        gsapApi.set(articleContentBox3El, {
          autoAlpha: 0,
          y: 90,
          pointerEvents: "none"
        });
      }
    };

    const resetPanelState = () => {
      if (!hasGsap) {
        articlePanel.style.removeProperty("opacity");
        articlePanel.style.removeProperty("transform");
        return;
      }
      gsapApi.set(articlePanel, {
        autoAlpha: 0,
        y: 16,
        pointerEvents: "none"
      });
      if (articleIntroTitleEl) {
        gsapApi.set(articleIntroTitleEl, { autoAlpha: 0 });
      }
      if (articleIntroMainEl) {
        gsapApi.set(articleIntroMainEl, { autoAlpha: 0, y: 24 });
      }
      if (articleIntroSubEl) {
        gsapApi.set(articleIntroSubEl, { autoAlpha: 0, y: -24 });
      }
      if (articleCloseBtn) {
        gsapApi.set(articleCloseBtn, { autoAlpha: 0, pointerEvents: "none" });
      }
      if (articleContentEl) {
        gsapApi.set(articleContentEl, {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          pointerEvents: "none"
        });
      }
      if (articleContentChildren.length) {
        gsapApi.set(articleContentChildren, { autoAlpha: 0, y: 14 });
      }
    };

    if (hasGsap) {
      resetPanelState();
      resetRevealStates();
      setFrameOpenState(false, true);
    }

    const renderArticle = (src) => {
      const articleData = getArticleData(src) || {};
      const localName = getLocalName(articleData);
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

      if (articleMapImageEl && articleMapImageWrapEl) {
        const mapSrc = resolveMapImageSrc(articleData.map_image_name);
        if (mapSrc) {
          articleMapImageEl.src = mapSrc;
          articleMapImageEl.alt = `${fullTitle} map`;
          articleMapImageWrapEl.classList.remove("is-empty");
        } else {
          articleMapImageEl.removeAttribute("src");
          articleMapImageEl.alt = "";
          articleMapImageWrapEl.classList.add("is-empty");
        }
      }

      if (localNameEl) {
        localNameEl.textContent = localName;
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

    const revealMetaItems = () => {
      if (hasMetaRevealed) return;
      hasMetaRevealed = true;
      if (!hasGsap) {
        articleMetaBoxEl?.classList.add("is-visible");
        return;
      }
      gsapApi.to(metaItems, {
        autoAlpha: 1,
        x: 0,
        duration: 0.95,
        ease: "power3.out",
        stagger: 0.12,
        overwrite: "auto"
      });
    };

    const updateMetaRevealState = () => {
      if (!articleMetaBoxEl) return;
      if (!isArticleOpen) {
        hasMetaRevealed = false;
        articleMetaBoxEl.classList.remove("is-visible");
        return;
      }
      if (hasMetaRevealed) return;

      const revealAt = Math.max(1, articleMetaBoxEl.offsetTop - articlePanel.clientHeight * 0.9);
      if (articlePanel.scrollTop >= revealAt) {
        revealMetaItems();
      }
    };

    const updateContainerSideExitState = () => {
      if (!articleMetaBoxEl || !articleContainerAEl || !articleContainerBEl) return;
      if (!isArticleOpen) {
        containersExited = false;
        articleMetaBoxEl.classList.remove("is-past-mid");
        return;
      }

      const panelRect = articlePanel.getBoundingClientRect();
      const boxRect = articleMetaBoxEl.getBoundingClientRect();
      const panelMid = panelRect.top + panelRect.height * 0.4;
      const boxMid = boxRect.top + boxRect.height * 0.5;
      const shouldExit = boxMid < panelMid;
      if (shouldExit === containersExited) return;

      containersExited = shouldExit;
      if (!hasGsap) {
        articleMetaBoxEl.classList.toggle("is-past-mid", shouldExit);
        return;
      }

      gsapApi.to(articleContainerAEl, {
        xPercent: shouldExit ? -115 : 0,
        autoAlpha: shouldExit ? 0 : 1,
        duration: 0.72,
        ease: "power3.inOut",
        overwrite: "auto"
      });
      gsapApi.to(articleContainerBEl, {
        xPercent: shouldExit ? 115 : 0,
        autoAlpha: shouldExit ? 0 : 1,
        duration: 0.72,
        ease: "power3.inOut",
        overwrite: "auto"
      });
    };

    const updateBox3RevealState = () => {
      if (!articlePanel || !articleContainerCEl || !articleContentBox3El) return;
      if (!isArticleOpen) {
        box3Revealed = false;
        articleContentBox3El.classList.remove("is-revealed");
        return;
      }

      const panelRect = articlePanel.getBoundingClientRect();
      const panelMid = panelRect.top + panelRect.height * 0.5;
      const containerRect = articleContainerCEl.getBoundingClientRect();
      const containerCMid = containerRect.top + containerRect.height * 0.5;
      const shouldReveal = containerCMid < panelMid;
      if (shouldReveal === box3Revealed) return;

      box3Revealed = shouldReveal;
      if (!hasGsap) {
        articleContentBox3El.classList.toggle("is-revealed", shouldReveal);
        return;
      }

      gsapApi.to(articleContentBox3El, {
        autoAlpha: shouldReveal ? 1 : 0,
        y: shouldReveal ? 0 : 90,
        duration: 0.82,
        ease: shouldReveal ? "power3.out" : "power2.inOut",
        overwrite: "auto",
        onStart: () => {
          articleContentBox3El.style.pointerEvents = shouldReveal ? "auto" : "none";
        },
        onComplete: () => {
          articleContentBox3El.style.pointerEvents = shouldReveal ? "auto" : "none";
        }
      });
    };

    const queueMetaRevealUpdate = () => {
      if (metaRevealRafId) return;
      metaRevealRafId = window.requestAnimationFrame(() => {
        metaRevealRafId = null;
        updateMetaRevealState();
        updateContainerSideExitState();
        updateBox3RevealState();
      });
    };

    const playArticleIntro = () => {
      if (!hasGsap) {
        articlePanel.style.opacity = "1";
        articlePanel.style.transform = "translateY(0)";
        articlePanel.style.pointerEvents = "auto";
        return;
      }

      if (articleIntroTimeline) {
        articleIntroTimeline.kill();
      }

      const clipStates = getClipStates();
      resetPanelState();
      resetRevealStates();

      gsapApi.set(articlePanel, {
        autoAlpha: 0,
        y: 16,
        pointerEvents: "auto"
      });
      if (articleCloseBtn) {
        gsapApi.set(articleCloseBtn, { autoAlpha: 0, pointerEvents: "none" });
      }
      if (articleIntroTitleEl) {
        gsapApi.set(articleIntroTitleEl, { autoAlpha: 0 });
      }
      if (articleIntroMainEl) {
        gsapApi.set(articleIntroMainEl, { autoAlpha: 0, y: 24 });
      }
      if (articleIntroSubEl) {
        gsapApi.set(articleIntroSubEl, { autoAlpha: 0, y: -24 });
      }
      if (articleContentEl) {
        gsapApi.set(articleContentEl, {
          clipPath: clipStates.start,
          pointerEvents: "none"
        });
      }
      if (articleContentChildren.length) {
        gsapApi.set(articleContentChildren, { autoAlpha: 0, y: 14 });
      }

      articleIntroTimeline = gsapApi.timeline();
      articleIntroTimeline
        .to(articlePanel, {
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
          ease: "power2.out"
        }, 0)
        .to(articleCloseBtn, {
          autoAlpha: 1,
          duration: 0.2,
          ease: "power1.out",
          onStart: () => {
            if (articleCloseBtn) {
              articleCloseBtn.style.pointerEvents = "auto";
            }
          }
        }, 0.16)
        .to(articleIntroTitleEl, {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power1.out"
        }, 0.08)
        .to(articleIntroMainEl, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out"
        }, 0.08)
        .to(articleIntroSubEl, {
          autoAlpha: 0.9,
          y: 0,
          duration: 0.55,
          ease: "power3.out"
        }, 0.12)
        .to(articleContentEl, {
          clipPath: clipStates.hold,
          duration: 0.42,
          ease: "power2.inOut"
        }, 0)
        .to(articleContentEl, {
          clipPath: clipStates.mid,
          duration: 0.66,
          ease: "power2.inOut"
        }, 0.42)
        .to(articleContentEl, {
          clipPath: clipStates.end,
          duration: 1.36,
          ease: "power3.inOut"
        }, 1.08)
        .to(articleIntroMainEl, {
          y: () => -((window.innerHeight || 900) * 1.1),
          autoAlpha: 0,
          duration: 0.92,
          ease: "power2.in"
        }, 1.3)
        .to(articleIntroSubEl, {
          y: () => ((window.innerHeight || 900) * 1.1),
          autoAlpha: 0,
          duration: 0.92,
          ease: "power2.in"
        }, 1.3)
        .to(articleIntroTitleEl, {
          autoAlpha: 0,
          duration: 0.2,
          ease: "power1.out"
        }, 1.95)
        .to(articleContentChildren, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.09
        }, 2.08)
        .add(() => {
          if (articleContentEl) {
            articleContentEl.style.pointerEvents = "auto";
          }
        }, 2.7);
    };

    const openArticle = () => {
      if (!desktopMq.matches || !largeImage.src || isArticleOpen) return;

      if (typeof hideBinocular === "function") {
        hideBinocular();
      }
      if (articleCloseTimeline) {
        articleCloseTimeline.kill();
        articleCloseTimeline = null;
      }

      renderArticle(largeImage.src);
      galleryFrame.classList.add("is-article-open");
      isArticleOpen = true;
      articlePanel.scrollTop = 0;
      startLiveTime();

      if (hasGsap) {
        setFrameOpenState(true);
      }
      playArticleIntro();
      queueMetaRevealUpdate();
    };

    const closeArticle = () => {
      if (!galleryFrame.classList.contains("is-article-open")) return;

      isArticleOpen = false;
      stopLiveTime();

      if (typeof hideBinocular === "function") {
        hideBinocular();
      }
      if (binocular) {
        binocular.style.removeProperty("display");
        binocular.style.removeProperty("visibility");
        binocular.style.removeProperty("opacity");
      }
      if (metaRevealRafId) {
        window.cancelAnimationFrame(metaRevealRafId);
        metaRevealRafId = null;
      }
      if (articleIntroTimeline) {
        articleIntroTimeline.kill();
        articleIntroTimeline = null;
      }

      if (!hasGsap) {
        galleryFrame.classList.remove("is-article-open");
        articlePanel.style.opacity = "0";
        articlePanel.style.transform = "translateY(16px)";
        articlePanel.style.pointerEvents = "none";
        return;
      }

      gsapApi.killTweensOf([
        articlePanel,
        articleIntroTitleEl,
        articleIntroMainEl,
        articleIntroSubEl,
        articleContentEl,
        articleCloseBtn,
        articleContentChildren,
        articleContainerAEl,
        articleContainerBEl,
        articleContentBox3El,
        ...metaItems,
        ...frameTargets
      ].filter(Boolean));

      articleCloseTimeline = gsapApi.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          galleryFrame.classList.remove("is-article-open");
          resetPanelState();
          resetRevealStates();
          setFrameOpenState(false, true);
          articleCloseTimeline = null;
        }
      });

      articleCloseTimeline
        .set(articlePanel, { pointerEvents: "none" }, 0)
        .set(articleCloseBtn, { pointerEvents: "none" }, 0)
        .to(articlePanel, {
          autoAlpha: 0,
          y: 20,
          duration: 0.28,
          ease: "power2.in"
        }, 0)
        .to(articleIntroTitleEl, {
          autoAlpha: 0,
          duration: 0.14
        }, 0)
        .to(articleContentChildren, {
          autoAlpha: 0,
          y: 10,
          duration: 0.18,
          stagger: 0.02,
          ease: "power1.in"
        }, 0)
        .to(descriptionEl, {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.34
        }, 0.06)
        .to(largeImageContainer, {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.34
        }, 0.06)
        .to(thumbsWrap, {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.34
        }, 0.06);
    };

    largeImage.addEventListener("click", openArticle);
    if (binocular) {
      binocular.addEventListener("click", openArticle);
    }
    if (articleCloseBtn) {
      articleCloseBtn.addEventListener("click", closeArticle);
    }
    articlePanel.addEventListener("scroll", queueMetaRevealUpdate, { passive: true });
    window.addEventListener("resize", () => {
      if (!desktopMq.matches && isArticleOpen) {
        closeArticle();
        return;
      }
      queueMetaRevealUpdate();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isArticleOpen) {
        closeArticle();
      }
    });

    return {
      onImageChange: (src) => {
        if (!isArticleOpen) return;
        renderArticle(src);
        startLiveTime();
        queueMetaRevealUpdate();
      }
    };
  };
})();
