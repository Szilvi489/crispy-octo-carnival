(() => {
    const sections = document.querySelectorAll(".slide-show-with-side-show-section");
    if (!sections.length) return;

    sections.forEach((section) => {
        const component = section.querySelector(".image-numbering-component");
        const numberEl = component ? component.querySelector(".image-numbering-component__number") : null;
        if (!numberEl) return;

        const dataEl = section.querySelector(".mountains-gallery-data");
        let total = 0;
        if (dataEl) {
            try {
                const data = JSON.parse(dataEl.textContent || "{}");
                total = Array.isArray(data.all) ? data.all.length : 0;
            } catch (error) {
                total = 0;
            }
        }
        if (!total) {
            total = section.querySelectorAll(".slide-images-container .slide-images").length;
        }

        const render = (index) => {
            const safeTotal = total || 1;
            const safeIndex = Math.min(Math.max(index, 1), safeTotal);
            numberEl.innerHTML = `<span class="image-numbering-component__current">${safeIndex}</span><span class="image-numbering-component__slash">/</span><span class="image-numbering-component__total">${safeTotal}</span>`;
        };

        render(1);
        section.addEventListener("slideshow:indexchange", (event) => {
            const detail = event.detail || {};
            if (typeof detail.total === "number" && detail.total > 0) {
                total = detail.total;
            }
            render(typeof detail.index === "number" ? detail.index : 1);
        });
    });
})();
