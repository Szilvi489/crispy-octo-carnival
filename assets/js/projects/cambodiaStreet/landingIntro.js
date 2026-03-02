(() => {
  const sections = document.querySelectorAll(".landing-intro");
  if (!sections.length) return;

  const gsapApi = window.gsap;
  if (!gsapApi || typeof gsapApi.timeline !== "function") {
    return;
  }

  sections.forEach((section) => {
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
      if (counterEl) counterEl.textContent = "0%";

      let delayMs = 2;
      const maxDelayMs = 500;
      const delayStep = images.length > 1
        ? (maxDelayMs - delayMs) / (images.length - 1)
        : 0;

      const timeline = gsapApi.timeline();
      timeline.fromTo(
        imageEl,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.76, ease: "power3.out" }
      );

      for (let i = 1; i < images.length; i += 1) {
        const progress = Math.round((i / (images.length - 1)) * 100);
        timeline.call(() => {
          imageEl.src = images[i];
          imageEl.setAttribute("data-location", "Cambodia");
          if (counterEl) {
            counterEl.textContent = `${progress}%`;
          }
        });
        timeline.to({}, { duration: Math.round(delayMs) / 1000 });
        delayMs = Math.min(maxDelayMs, delayMs + delayStep);
      }

      timeline.call(() => {
        if (counterEl) counterEl.textContent = "100%";
      });
      timeline.to(
        imageEl,
        { clipPath: "inset(100% 0% 0% 0%)", duration: 0.76, ease: "power3.in" }
      );
      timeline.call(() => {
        section.remove();
      });
    } catch (error) {
      console.error("Landing intro: invalid JSON", error);
    }
  });
})();
