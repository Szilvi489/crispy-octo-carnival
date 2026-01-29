(() => {
    const trigger = document.querySelector(".navSquareColour");
    const overlay = document.getElementById("navOverlay");
    const closeButton = document.getElementById("navClose");
    const imageOfTheDayOpenButton = document.querySelector(".navHeartButton");
    const imageOfTheDayOverlay = document.getElementById("imageOfTheDayOverlay");
    const imageOfTheDayCloseButton = document.querySelector(".imageOfTheDayClose");

    if (!trigger || !overlay || !closeButton) {
        return;
    }

    const root = document.documentElement;

    const openMenu = () => {
        root.classList.add("nav-open");
        trigger.setAttribute("aria-expanded", "true");
        overlay.setAttribute("aria-hidden", "false");
    };

    const closeMenu = () => {
        root.classList.remove("nav-open");
        trigger.setAttribute("aria-expanded", "false");
        overlay.setAttribute("aria-hidden", "true");
    };

    trigger.addEventListener("click", openMenu);
    closeButton.addEventListener("click", closeMenu);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (root.classList.contains("image-of-the-day-open")) {
                closeImageOfTheDay();
                return;
            }
            closeMenu();
        }
    });

    const openImageOfTheDay = () => {
        if (!imageOfTheDayOverlay) {
            return;
        }

        //closeMenu();
        root.classList.add("image-of-the-day-open");
        imageOfTheDayOverlay.setAttribute("aria-hidden", "false");
    };

    const closeImageOfTheDay = () => {
        if (!imageOfTheDayOverlay) {
            return;
        }

        root.classList.remove("image-of-the-day-open");
        imageOfTheDayOverlay.setAttribute("aria-hidden", "true");
    };

    if (imageOfTheDayOpenButton && imageOfTheDayOverlay) {
        imageOfTheDayOpenButton.addEventListener("click", openImageOfTheDay);
        imageOfTheDayOverlay.addEventListener("click", (event) => {
            if (event.target === imageOfTheDayOverlay) {
                closeImageOfTheDay();
            }
        });
    }

    if (imageOfTheDayCloseButton) {
        imageOfTheDayCloseButton.addEventListener("click", closeImageOfTheDay);
    }
})();
