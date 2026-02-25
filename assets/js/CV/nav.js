(function () {
    var cvSection = document.querySelector(".cv-section");
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".cv-nav a"));

    function resetNavEntrance() {
        navItems.forEach(function (item) {
            item.classList.remove("nav-enter");
            item.style.removeProperty("--nav-enter-delay");
        });

        if (cvSection) {
            cvSection.classList.remove("nav-enter-active");
        }
    }

    function startNavEntrance() {
        if (cvSection) {
            cvSection.classList.add("nav-enter-active");
        }

        navItems.forEach(function (item, index) {
            item.classList.add("nav-enter");
            item.style.setProperty("--nav-enter-delay", (index * 110) + "ms");
        });
    }

    resetNavEntrance();
    document.addEventListener("cv-loader-start", resetNavEntrance);
    document.addEventListener("cv-loader-exit-start", startNavEntrance);
})();
