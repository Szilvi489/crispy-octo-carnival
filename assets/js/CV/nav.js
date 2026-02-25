(function () {
    var cvSection = document.querySelector(".cv-section");
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".cv-nav a"));

    function resetNavEntrance() {
        navItems.forEach(function (item) {
            item.classList.remove("nav-enter", "from-left", "from-right", "from-top", "from-bottom");
            item.style.removeProperty("--nav-enter-delay");
        });

        if (cvSection) {
            cvSection.classList.remove("nav-enter-active");
        }
    }

    function startNavEntrance() {
        var directions = ["from-left", "from-right", "from-top", "from-bottom"];

        if (cvSection) {
            cvSection.classList.add("nav-enter-active");
        }

        navItems.forEach(function (item, index) {
            var directionClass = directions[Math.floor(Math.random() * directions.length)];
            item.classList.add("nav-enter", directionClass);
            item.style.setProperty("--nav-enter-delay", (index * 110) + "ms");
        });
    }

    resetNavEntrance();
    document.addEventListener("cv-loader-start", resetNavEntrance);
    document.addEventListener("cv-loader-exit-start", startNavEntrance);
})();
