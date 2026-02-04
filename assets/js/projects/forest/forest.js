(() => {
    const dataEl = document.getElementById("forest-gallery-data");
    if (!dataEl) {
        return;
    }

      let data;
    try {
        data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
        return;
    }

    console.log(data);
    const track = document.querySelector(".image-track");
    const carousel = document.querySelector(".image-carousel");

    const doubleExpoImages = {
        first :document.querySelector(".double-expo-first"),
        second :document.querySelector(".double-expo-second")
    };

    if (!track || !carousel || !doubleExpoImages.first || !doubleExpoImages.second) {
        return;
    } 

    const layout = Array.isArray(data.layout) ? data.layout : [];
    const all = Array.isArray(data.all) ? data.all : [];

    console.log(layout);
    console.log(all);




})();