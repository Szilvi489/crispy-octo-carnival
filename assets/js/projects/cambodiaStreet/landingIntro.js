(() => {
  const sections = document.querySelectorAll(".landing-intro");
  if (!sections.length) return;

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const waitForAnimationEnd = (el, fallbackMs) => new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("animationend", finish);
      resolve();
    };
    el.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, fallbackMs);
  });

  sections.forEach(async (section) => {
    const dataEl = section.querySelector("#cambodia-street-gallery-thumbnail-data");
    if (!dataEl) return;
    const imageEl = section.querySelector(".landing-intro-content img");
    if (!imageEl) return;
    const counterEl = section.querySelector(".landing-intro-counter");

    try {
      const data = JSON.parse(dataEl.textContent || "{}");
      console.log("Landing intro data:", data);

      const images = Array.isArray(data.all) ? data.all.filter(Boolean) : [];
      if (!images.length) return;

      imageEl.alt = "Loading preview";
      imageEl.src = images[0];

      imageEl.classList.add("reveal-up");
      await waitForAnimationEnd(imageEl, 800);
      imageEl.classList.remove("reveal-up");
      if (counterEl) counterEl.textContent = "0%";

      let delayMs = 2;
      const maxDelayMs = 500;
      const delayStep = images.length > 1
        ? (maxDelayMs - delayMs) / (images.length - 1)
        : 0;

      for (let i = 1; i < images.length; i += 1) {
        imageEl.src = images[i];
        imageEl.setAttribute("data-location", "Cambodia");
        if (counterEl) {
          const progress = Math.round((i / (images.length - 1)) * 100);
          counterEl.textContent = `${progress}%`;
        }
        await wait(Math.round(delayMs));
        delayMs = Math.min(maxDelayMs, delayMs + delayStep);
      }
      if (counterEl) counterEl.textContent = "100%";

      imageEl.classList.add("reveal-down");
      await waitForAnimationEnd(imageEl, 800);
      imageEl.classList.remove("reveal-down");
      section.remove();
    } catch (error) {
      console.error("Landing intro: invalid JSON", error);
    }
  });
})();
