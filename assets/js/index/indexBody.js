const indexImageMetaCache = new Map();

function isIndexVideoSource(src) {
  return /\.(mp4|webm|mov)$/i.test(src || "");
}

function preloadIndexImageMeta(src) {
  if (!src) {
    return Promise.resolve(null);
  }

  if (indexImageMetaCache.has(src)) {
    return Promise.resolve(indexImageMetaCache.get(src));
  }

  return new Promise((resolve) => {
    if (isIndexVideoSource(src)) {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const meta = {
          width: video.videoWidth || 1,
          height: video.videoHeight || 1,
          ratio: (video.videoHeight || 1) / (video.videoWidth || 1),
        };
        indexImageMetaCache.set(src, meta);
        resolve(meta);
      };

      video.onerror = () => resolve(null);
      video.src = src;
      return;
    }

    const image = new Image();

    image.onload = () => {
      const meta = {
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
        ratio: (image.naturalHeight || 1) / (image.naturalWidth || 1),
      };
      indexImageMetaCache.set(src, meta);
      resolve(meta);
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function getIndexImageRatio(item, media) {
  const cachedRatio = parseFloat(item.dataset.aspectRatio || "");
  if (Number.isFinite(cachedRatio) && cachedRatio > 0) {
    return cachedRatio;
  }

  const src = media?.getAttribute("src");
  if (src && indexImageMetaCache.has(src)) {
    const meta = indexImageMetaCache.get(src);
    item.dataset.aspectRatio = `${meta.ratio}`;
    return meta.ratio;
  }

  if (media?.tagName === "VIDEO" && media.videoWidth) {
    const ratio = media.videoHeight / media.videoWidth;
    item.dataset.aspectRatio = `${ratio}`;
    return ratio;
  }

  if (media?.naturalWidth) {
    const ratio = media.naturalHeight / media.naturalWidth;
    item.dataset.aspectRatio = `${ratio}`;
    return ratio;
  }

  return null;
}

function resizeIndexGallery() {
  const grid = document.querySelector(".index-gallery_grid");
  if (!grid) return;

  const styles = window.getComputedStyle(grid);
  const rowHeight = parseInt(styles.getPropertyValue("grid-auto-rows"), 10);
  const gap = parseInt(styles.getPropertyValue("gap"), 10);

  grid.querySelectorAll(".index-gallery_item").forEach((item) => {
    const media = item.querySelector("img, video");
    if (!media) return;

    const applySpan = () => {
      const width = item.clientWidth;
      const ratio = getIndexImageRatio(item, media);
      if (!width || !ratio) return;

      const targetHeight = Math.round(width * ratio);
      const rowSpan = Math.ceil((targetHeight + gap) / (rowHeight + gap));
      item.style.gridRowEnd = `span ${rowSpan}`;
    };

    if (media.tagName === "VIDEO") {
      if (media.readyState >= 1) {
        applySpan();
      } else {
        media.addEventListener("loadedmetadata", applySpan, { once: true });
      }
    } else if (media.complete) {
      applySpan();
    } else {
      media.addEventListener("load", applySpan, { once: true });
    }
  });
}

function assignIndexGallerySizes(items) {
  const sizeClasses = ["size-s", "size-m", "size-l"];

  items.forEach((item) => {
    item.classList.remove("size-s", "size-m", "size-l");
    item.classList.remove("over-signature");
    const size =
      sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
    item.classList.add(size);

    if (Math.random() < 0.38) {
      item.classList.add("over-signature");
    }
  });
}

function setupInfiniteIndexGallery() {
  const grid = document.querySelector(".index-gallery_grid");
  if (!grid) return;

  const baseItems = Array.from(
    grid.querySelectorAll(".index-gallery_item")
  );
  if (!baseItems.length) return;

  const sources = baseItems
    .map((item) => {
      const link = item.querySelector("a");
      const media = item.querySelector("img, video");
      if (!media) return null;
      return {
        src: media.getAttribute("src"),
        alt:
          media.getAttribute("alt") ||
          media.getAttribute("aria-label") ||
          "",
        href: link?.getAttribute("href") || "",
        type: media.tagName === "VIDEO" ? "video" : "image",
      };
    })
    .filter(Boolean);

  if (!sources.length) return;

  const poolSize = 18;
  const appendBatchSize = 5;

  let lastSrc = sources[0].src;
  let isAppending = false;

  const createItem = ({ src, alt, href, type }) => {
    const figure = document.createElement("figure");
    figure.className = "index-gallery_item";

    const link = document.createElement("a");
    link.href = href || "#";

    const media =
      type === "video" || isIndexVideoSource(src)
        ? document.createElement("video")
        : document.createElement("img");

    media.src = src;

    if (media.tagName === "VIDEO") {
      media.setAttribute("aria-label", alt);
      media.autoplay = true;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media.alt = alt;
      media.loading = "eager";
      media.decoding = "async";
    }

    link.appendChild(media);
    figure.appendChild(link);

    const cached = indexImageMetaCache.get(src);
    if (cached) {
      figure.dataset.aspectRatio = `${cached.ratio}`;
    }

    return figure;
  };

  const getRandomSource = () => {
    let pick = sources[Math.floor(Math.random() * sources.length)];
    if (sources.length > 1) {
      while (pick.src === lastSrc) {
        pick = sources[Math.floor(Math.random() * sources.length)];
      }
    }
    lastSrc = pick.src;
    return pick;
  };

  while (baseItems.length < poolSize) {
    const item = createItem(getRandomSource());
    baseItems.push(item);
    grid.appendChild(item);
  }

  assignIndexGallerySizes(baseItems);
  resizeIndexGallery();

  const appendBatch = () => {
    const nextItems = [];

    for (let i = 0; i < appendBatchSize; i += 1) {
      nextItems.push(createItem(getRandomSource()));
    }

    assignIndexGallerySizes(nextItems);

    const fragment = document.createDocumentFragment();
    nextItems.forEach((item) => fragment.appendChild(item));
    grid.appendChild(fragment);

    resizeIndexGallery();
    requestAnimationFrame(resizeIndexGallery);
  };

  const onScroll = () => {
    if (isAppending) return;
    const bufferWidth = window.innerWidth * 1.5;
    const bufferHeight = window.innerHeight * 1.5;

    const right = window.scrollX + window.innerWidth;
    const bottom = window.scrollY + window.innerHeight;

    const pageWidth = document.documentElement.scrollWidth;
    const pageHeight = document.documentElement.scrollHeight;

    if (right + bufferWidth < pageWidth) return;
    if (bottom + bufferHeight < pageHeight) return;

    isAppending = true;
    requestAnimationFrame(() => {
      appendBatch();
      isAppending = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupIndexCursor() {
  const supportsHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!supportsHover) return;

  const grid = document.querySelector(".index-gallery_grid");
  if (!grid) return;

  const cursor = document.createElement("div");
  cursor.className = "cursor-circle";
  document.body.appendChild(cursor);

  const randomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 70%, 55%, 0.9)`;
  };

  document.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  grid.addEventListener("mouseover", (event) => {
    const target = event.target.closest(".index-gallery_item img, .index-gallery_item video");
    if (!target) return;
    cursor.style.backgroundColor = randomColor();
    cursor.classList.add("is-visible");
    document.body.classList.add("cursor-hidden");
  });

  grid.addEventListener("mouseout", (event) => {
    const target = event.target.closest(".index-gallery_item img, .index-gallery_item video");
    if (!target) return;
    const related = event.relatedTarget;
    if (related && related.closest(".index-gallery_item img, .index-gallery_item video")) return;
    cursor.classList.remove("is-visible");
    document.body.classList.remove("cursor-hidden");
  });
}

function lockIndexGalleryNavigationOnMobile() {
  const mobileLockQuery = window.matchMedia("(max-width: 900px)");
  const grid = document.querySelector(".index-gallery_grid");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const link = event.target.closest(".index-gallery_item a");
    if (!link || !mobileLockQuery.matches) return;
    event.preventDefault();
  });
}

let hasInitializedIndexBody = false;

window.initIndexBody = async function () {
  if (hasInitializedIndexBody) {
    return;
  }

  hasInitializedIndexBody = true;

  const grid = document.querySelector(".index-gallery_grid");
  const sources = grid
    ? Array.from(grid.querySelectorAll(".index-gallery_item img, .index-gallery_item video"))
        .map((media) => media.getAttribute("src"))
        .filter(Boolean)
    : [];

  await Promise.all(sources.map((src) => preloadIndexImageMeta(src)));

  setupInfiniteIndexGallery();
  setupIndexCursor();
  lockIndexGalleryNavigationOnMobile();
  resizeIndexGallery();
};

window.addEventListener("resize", () =>
  requestAnimationFrame(resizeIndexGallery)
);
