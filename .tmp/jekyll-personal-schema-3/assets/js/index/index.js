function resizeIndexGallery() {
  const grid = document.querySelector(".index-gallery_grid");
  if (!grid) return;

  const styles = window.getComputedStyle(grid);
  const rowHeight = parseInt(styles.getPropertyValue("grid-auto-rows"), 10);
  const gap = parseInt(styles.getPropertyValue("gap"), 10);

  grid.querySelectorAll(".index-gallery_item").forEach((item) => {
    const img = item.querySelector("img");
    if (!img) return;

    const applySpan = () => {
      const width = item.clientWidth;
      if (!width || !img.naturalWidth) return;

      const ratio = img.naturalHeight / img.naturalWidth;
      const targetHeight = Math.round(width * ratio);
      const rowSpan = Math.ceil((targetHeight + gap) / (rowHeight + gap));
      item.style.gridRowEnd = `span ${rowSpan}`;
    };

    if (img.complete) {
      applySpan();
    } else {
      img.addEventListener("load", applySpan, { once: true });
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
      const img = item.querySelector("img");
      if (!img) return null;
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    })
    .filter(Boolean);

  if (!sources.length) return;

  const poolSize = 18;
  const recycleBatchSize = 5;

  let lastSrc = sources[0].src;
  let isAppending = false;

  const createItem = ({ src, alt }) => {
    const figure = document.createElement("figure");
    figure.className = "index-gallery_item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    figure.appendChild(img);

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

  const recycleBatch = () => {
    const currentItems = Array.from(
      grid.querySelectorAll(".index-gallery_item")
    );
    if (!currentItems.length) return;

    const batchSize = Math.min(recycleBatchSize, currentItems.length);
    const movedItems = [];

    for (let i = 0; i < batchSize; i += 1) {
      const item = currentItems[i];
      const img = item.querySelector("img");
      if (!img) continue;

      const next = getRandomSource();
      img.src = next.src;
      img.alt = next.alt;
      img.addEventListener(
        "load",
        () => requestAnimationFrame(resizeIndexGallery),
        { once: true }
      );

      movedItems.push(item);
    }

    assignIndexGallerySizes(movedItems);
    movedItems.forEach((item) => grid.appendChild(item));
    resizeIndexGallery();
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
      recycleBatch();
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
    const target = event.target.closest(".index-gallery_item img");
    if (!target) return;
    cursor.style.backgroundColor = randomColor();
    cursor.classList.add("is-visible");
    document.body.classList.add("cursor-hidden");
  });

  grid.addEventListener("mouseout", (event) => {
    const target = event.target.closest(".index-gallery_item img");
    if (!target) return;
    const related = event.relatedTarget;
    if (related && related.closest(".index-gallery_item img")) return;
    cursor.classList.remove("is-visible");
    document.body.classList.remove("cursor-hidden");
  });
}

window.addEventListener("load", () => {
  setupInfiniteIndexGallery();
  setupIndexCursor();
});
window.addEventListener("resize", () =>
  requestAnimationFrame(resizeIndexGallery)
);
