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
    const size =
      sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
    item.classList.add(size);
  });
}

function setupInfiniteIndexGallery() {
  const grid = document.querySelector(".index-gallery_grid");
  if (!grid) return;

  const baseItems = Array.from(
    grid.querySelectorAll(".index-gallery_item")
  );
  console.log(baseItems.length);
  if (!baseItems.length) return;

  const sources = baseItems
    .map((item) => {
      const img = item.querySelector("img");
      if (!img) return null;
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    })
    .filter(Boolean);

  if (!sources.length) return;

  assignIndexGallerySizes(baseItems);
  resizeIndexGallery();

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

  const appendBatch = () => {
    const batchSize = Math.max(6, sources.length);
    const newItems = [];

    for (let i = 0; i < batchSize; i += 1) {
      const item = createItem(getRandomSource());
      newItems.push(item);
      grid.appendChild(item);
    }

    assignIndexGallerySizes(newItems);
    resizeIndexGallery();
  };

  const onScroll = () => {
    if (isAppending) return;
    const buffer = window.innerHeight * 1.5;
    const bottom = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    if (bottom + buffer < pageHeight) return;

    isAppending = true;
    requestAnimationFrame(() => {
      appendBatch();
      isAppending = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}

window.addEventListener("load", () => {
  setupInfiniteIndexGallery();
});
window.addEventListener("resize", () =>
  requestAnimationFrame(resizeIndexGallery)
);
