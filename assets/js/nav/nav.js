(() => {
    const trigger = document.querySelector(".navSquareColour");
    const overlay = document.getElementById("navOverlay");
    const closeButton = document.getElementById("navClose");

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
            closeMenu();
        }
    });
})();
