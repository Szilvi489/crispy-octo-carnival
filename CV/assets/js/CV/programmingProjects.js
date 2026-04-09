(function () {
    var section = document.getElementById("cv-programming-projects");
    var heading = section ? section.querySelector(".cv-programming-projects-heading") : null;
    var stage = section ? section.querySelector(".cv-programming-projects-stage") : null;
    var groupTrack = section ? section.querySelector(".cv-programming-projects-group-track") : null;
    var cardTrack = section ? section.querySelector(".cv-programming-projects-card-track") : null;
    var dataNode = section ? section.querySelector(".cv-programming-projects-data") : null;
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;
    var mobileLayoutQuery = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
    var rafId = null;
    var scrollDriver = null;
    var cards = [];
    var groupCards = [];
    var projects = [];
    var groups = [];
    var revealStart = 0;
    var revealEnd = 0;
    var revealDistance = 1;
    var revealScrollDistance = 1;
    var titleSettleDistance = 1;
    var cardEntryDelayDistance = 1;
    var cardsScrollDistance = 1;
    var totalScrollDistance = 1;
    var stageShown = false;
    var cachedViewportHeight = 0;
    var currentLayoutMode = "";

    if (!section || !heading || !stage || !groupTrack || !cardTrack || !dataNode) {
        return;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function smoothstep(t) {
        var x = clamp(t, 0, 1);
        return x * x * (3 - (2 * x));
    }

    function toPlainObject(value) {
        return value && typeof value === "object" ? value : {};
    }

    function toArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function humanizeKey(value) {
        if (!value || typeof value !== "string") {
            return "";
        }

        return value
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
    }

    function setCssVar(name, value) {
        var cssVar = {};
        if (gsapApi && typeof gsapApi.set === "function") {
            cssVar[name] = value;
            gsapApi.set(section, cssVar);
            return;
        }
        section.style.setProperty(name, value);
    }

    function parseData() {
        var parsed;
        try {
            parsed = JSON.parse(dataNode.textContent || "{}");
        } catch (error) {
            parsed = {};
        }

        return {
            base: toPlainObject(parsed.base),
            i18n: toPlainObject(parsed.i18n)
        };
    }

    function resolveProjects(data) {
        var base = data.base;
        var i18n = data.i18n;
        var i18nProjects = toPlainObject(i18n.projects);
        var i18nGroups = toPlainObject(i18n.project_groups);
        var i18nTech = toPlainObject(i18n.technologies);
        var i18nCategories = toPlainObject(i18n.categories);
        var baseProjects = toArray(base.projects);
        var excludedTechKeys = {
            github: true
        };
        var grouped = {};
        var discoveredOrder = [];
        var explicitOrder = toArray(base.project_group_order);
        var finalOrder = [];
        var normalized = [];
        var keySeen = {};

        baseProjects.forEach(function (project) {
            var item = toPlainObject(project);
            var groupKey = item.project_group_key && typeof item.project_group_key === "string"
                ? item.project_group_key
                : "ungrouped";

            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
                discoveredOrder.push(groupKey);
            }

            grouped[groupKey].push(item);
        });

        explicitOrder.forEach(function (groupKey) {
            if (!grouped[groupKey] || keySeen[groupKey]) {
                return;
            }
            keySeen[groupKey] = true;
            finalOrder.push(groupKey);
        });

        discoveredOrder.forEach(function (groupKey) {
            if (keySeen[groupKey]) {
                return;
            }
            keySeen[groupKey] = true;
            finalOrder.push(groupKey);
        });

        finalOrder.forEach(function (groupKey) {
            grouped[groupKey].forEach(function (project) {
                var slug = project.slug && typeof project.slug === "string"
                    ? project.slug
                    : "project";
                var projectI18n = toPlainObject(i18nProjects[slug]);
                var techGroups = toArray(project.tech_groups).map(function (group) {
                    var safeGroup = toPlainObject(group);
                    var categoryKey = safeGroup.category_key && typeof safeGroup.category_key === "string"
                        ? safeGroup.category_key
                        : "other";
                    var items = toArray(safeGroup.items).map(function (techKey) {
                        var key = typeof techKey === "string" ? techKey : "";
                        if (excludedTechKeys[key]) {
                            return "";
                        }
                        var tech = toPlainObject(i18nTech[key]);
                        return tech.label || humanizeKey(key) || key;
                    }).filter(Boolean);

                    return {
                        category: i18nCategories[categoryKey] || humanizeKey(categoryKey) || categoryKey,
                        items: items
                    };
                });

                normalized.push({
                    slug: slug,
                    groupKey: groupKey,
                    groupLabel: i18nGroups[groupKey] || humanizeKey(groupKey) || groupKey,
                    title: projectI18n.title || humanizeKey(slug),
                    description: projectI18n.description || "",
                    githubLink: project.github_link || "",
                    techGroups: techGroups
                });
            });
        });

        return normalized;
    }

    function buildGroups(list) {
        var grouped = [];

        list.forEach(function (project, index) {
            var previous = grouped[grouped.length - 1];
            if (!previous || previous.key !== project.groupKey) {
                grouped.push({
                    key: project.groupKey,
                    label: project.groupLabel,
                    startIndex: index,
                    endIndex: index
                });
                return;
            }

            previous.endIndex = index;
        });

        return grouped;
    }

    function renderCards(data, githubIconPath, githubAriaLabel) {
        var fragment = document.createDocumentFragment();

        cardTrack.textContent = "";

        data.forEach(function (project, index) {
            var card = document.createElement("article");
            var head = document.createElement("div");
            var title = document.createElement("h4");
            var description = document.createElement("p");
            var groupsWrap = document.createElement("div");
            var meta = document.createElement("div");
            var counter = document.createElement("span");
            var githubLink;
            var githubIcon;

            card.className = "cv-programming-projects-card";
            card.dataset.index = String(index);
            card.dataset.groupKey = project.groupKey;
            card.setAttribute("aria-hidden", "true");

            head.className = "cv-programming-projects-card-head";

            title.className = "cv-programming-projects-card-title";
            title.textContent = project.title;
            head.appendChild(title);

            meta.className = "cv-programming-projects-card-meta";
            counter.className = "cv-programming-projects-card-counter";
            counter.textContent = String(index + 1) + " / " + String(data.length);
            meta.appendChild(counter);

            if (project.githubLink) {
                githubLink = document.createElement("a");
                githubLink.className = "cv-programming-projects-github-link";
                githubLink.href = project.githubLink;
                githubLink.target = "_blank";
                githubLink.rel = "noopener noreferrer";
                githubLink.setAttribute("aria-label", githubAriaLabel + ": " + project.title);

                if (githubIconPath) {
                    githubIcon = document.createElement("img");
                    githubIcon.src = githubIconPath;
                    githubIcon.alt = "";
                    githubIcon.loading = "lazy";
                    githubLink.appendChild(githubIcon);
                } else {
                    githubLink.textContent = "GH";
                }
            }

            if (githubLink) {
                meta.appendChild(githubLink);
            }

            head.appendChild(meta);
            card.appendChild(head);

            description.className = "cv-programming-projects-card-description";
            description.textContent = project.description;
            card.appendChild(description);

            groupsWrap.className = "cv-programming-projects-tech-groups";
            project.techGroups.forEach(function (group) {
                var groupNode = document.createElement("section");
                var categoryNode = document.createElement("h5");
                var itemsNode = document.createElement("p");

                groupNode.className = "cv-programming-projects-tech-group";
                categoryNode.className = "cv-programming-projects-tech-category";
                itemsNode.className = "cv-programming-projects-tech-items";

                categoryNode.textContent = group.category;
                itemsNode.textContent = group.items.join(" · ");

                groupNode.appendChild(categoryNode);
                groupNode.appendChild(itemsNode);
                groupsWrap.appendChild(groupNode);
            });

            card.appendChild(groupsWrap);
            fragment.appendChild(card);
        });

        cardTrack.appendChild(fragment);
        cards = Array.prototype.slice.call(cardTrack.querySelectorAll(".cv-programming-projects-card"));
    }

    function renderGroupCards(list) {
        var fragment = document.createDocumentFragment();

        groupTrack.textContent = "";

        list.forEach(function (group, index) {
            var node = document.createElement("h3");
            node.className = "cv-programming-projects-group-card";
            node.dataset.index = String(index);
            node.textContent = group.label;
            fragment.appendChild(node);
        });

        groupTrack.appendChild(fragment);
        groupCards = Array.prototype.slice.call(groupTrack.querySelectorAll(".cv-programming-projects-group-card"));
    }

    function updateMetrics(viewportHeight) {
        var totalHeight;
        if (viewportHeight === cachedViewportHeight) {
            return;
        }

        cachedViewportHeight = viewportHeight;
        revealStart = viewportHeight * 0.75;
        revealEnd = -(viewportHeight * 0.52);
        revealDistance = Math.max(1, revealStart - revealEnd);

        revealScrollDistance = Math.max(viewportHeight * 0.95, revealDistance);
        titleSettleDistance = viewportHeight * 0.08;
        cardEntryDelayDistance = viewportHeight * 0.24;
        cardsScrollDistance = Math.max(
            viewportHeight * 1.15,
            Math.max(1, projects.length - 1) * viewportHeight * 0.92
        );
        totalScrollDistance = revealScrollDistance + titleSettleDistance + cardEntryDelayDistance + cardsScrollDistance;

        totalHeight = viewportHeight + totalScrollDistance;
        section.style.minHeight = totalHeight.toFixed(2) + "px";
    }

    function updateGroupCards(activeGroupFloat) {
        groupCards.forEach(function (groupCard, index) {
            var diff = index - activeGroupFloat;
            var distance = Math.abs(diff);
            var yPercent = diff * 110;
            var zPx = -(distance * 120);
            var rotateX = diff * 88;
            var opacity = clamp(1 - (distance * 0.58), 0, 1);
            var blur = Math.max(0, distance - 0.45) * 2.2;
            var scale = 1 - clamp(distance * 0.06, 0, 0.2);

            if (gsapApi && typeof gsapApi.set === "function") {
                gsapApi.set(groupCard, {
                    yPercent: yPercent,
                    z: zPx,
                    rotateX: rotateX,
                    scale: scale,
                    autoAlpha: opacity,
                    filter: "blur(" + blur.toFixed(2) + "px)"
                });
            } else {
                groupCard.style.transform =
                    "translate3d(0, " + yPercent.toFixed(2) + "%, " + zPx.toFixed(2) + "px) " +
                    "rotateX(" + rotateX.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
                groupCard.style.opacity = opacity.toFixed(3);
                groupCard.style.filter = "blur(" + blur.toFixed(2) + "px)";
            }
            groupCard.style.zIndex = String(900 - Math.round(distance * 100));
        });
    }

    function getActiveGroupFloat(activeProjectFloat) {
        var i;
        var current;
        var next;
        var transition;

        if (!groups.length) {
            return 0;
        }

        for (i = 0; i < groups.length; i += 1) {
            current = groups[i];
            next = groups[i + 1];

            if (activeProjectFloat <= current.endIndex) {
                return i;
            }

            if (!next) {
                return i;
            }

            if (activeProjectFloat < next.startIndex) {
                transition = (activeProjectFloat - current.endIndex) / Math.max(0.0001, next.startIndex - current.endIndex);
                return i + clamp(transition, 0, 1);
            }
        }

        return groups.length - 1;
    }

    function updateCards(activeFloat) {
        cards.forEach(function (card, index) {
            var diff = index - activeFloat;
            var distance = Math.abs(diff);
            var yPercent = diff * 106;
            var zPx = -(distance * 130);
            var rotateX = diff * 88;
            var opacity = clamp(1 - (distance * 0.52), 0, 1);
            var scale = 1 - clamp(distance * 0.06, 0, 0.22);
            var blur = Math.max(0, distance - 0.42) * 2.3;

            if (gsapApi && typeof gsapApi.set === "function") {
                gsapApi.set(card, {
                    yPercent: yPercent,
                    z: zPx,
                    rotateX: rotateX,
                    scale: scale,
                    autoAlpha: opacity,
                    filter: "blur(" + blur.toFixed(2) + "px)"
                });
            } else {
                card.style.transform =
                    "translate3d(0, " + yPercent.toFixed(2) + "%, " + zPx.toFixed(2) + "px) " +
                    "rotateX(" + rotateX.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
                card.style.opacity = opacity.toFixed(3);
                card.style.filter = "blur(" + blur.toFixed(2) + "px)";
            }
            card.style.zIndex = String(1000 - Math.round(distance * 100));
            card.setAttribute("aria-hidden", distance > 0.92 ? "true" : "false");
            card.style.pointerEvents = distance < 0.5 ? "auto" : "none";
        });
    }

    function renderTimeline(rawSectionScroll, viewportHeight, inViewport) {
        var sectionScroll;
        var revealScroll;
        var revealNormalized;
        var rawReveal;
        var revealLinear;
        var revealProgress;
        var stageAlpha;
        var revealComplete;
        var cardPhase;
        var activeFloat;
        var activeGroupFloat;
        var titlePhaseIn;
        var titleGrowPhase;
        var titleMovePhase;
        var easedTitleMove;
        var titleX;
        var titleY;
        var titleScale;
        var titleOpacity;
        var cardsStartScroll;
        var postSectionScroll;
        var titleScrollOffsetPx;
        var stageEnterAlpha;
        var stageHold;

        updateMetrics(viewportHeight);

        sectionScroll = clamp(rawSectionScroll, 0, totalScrollDistance);
        postSectionScroll = Math.max(0, rawSectionScroll - totalScrollDistance);
        titleScrollOffsetPx = -postSectionScroll;
        revealScroll = clamp(sectionScroll, 0, revealScrollDistance);
        revealNormalized = revealScroll / Math.max(1, revealScrollDistance);

        rawReveal = revealNormalized;
        revealLinear = clamp(rawReveal, 0, 1);
        revealProgress = Math.pow(revealLinear, 1.95);
        revealComplete = revealProgress >= 0.995;

        /* Title appears in the center, grows, then moves upward to final top position. */
        titlePhaseIn = clamp((revealProgress - 0.2) / 0.12, 0, 1);
        titleGrowPhase = clamp((revealProgress - 0.2) / 0.30, 0, 1);
        titleMovePhase = clamp((revealProgress - 0.62) / 0.22, 0, 1);
        easedTitleMove = smoothstep(smoothstep(titleMovePhase));
        titleX = 50;
        titleY = 50 + ((11 - 50) * easedTitleMove);
        titleScale = 0.34 + (1.0 * titleGrowPhase) - (0.16 * easedTitleMove);
        titleScale = clamp(titleScale, 0.3, 1.15);
        titleOpacity = inViewport ? titlePhaseIn : 0;

        cardsStartScroll = revealScrollDistance + titleSettleDistance + cardEntryDelayDistance;
        cardPhase = clamp(
            (sectionScroll - cardsStartScroll) / Math.max(1, cardsScrollDistance),
            0,
            1
        );

        stageEnterAlpha = clamp((revealProgress - 0.86) / 0.10, 0, 1);
        stageHold = sectionScroll >= cardsStartScroll ? 1 : stageEnterAlpha;
        stageAlpha = clamp(stageHold, 0, 1);

        setCssVar("--cv-programming-projects-reveal-progress", revealProgress.toFixed(4));
        setCssVar("--cv-programming-projects-stage-alpha", stageAlpha.toFixed(3));
        setCssVar("--cv-programming-projects-title-x", titleX.toFixed(3));
        setCssVar("--cv-programming-projects-title-y", titleY.toFixed(3));
        setCssVar("--cv-programming-projects-title-scale", titleScale.toFixed(3));
        setCssVar("--cv-programming-projects-title-opacity", titleOpacity.toFixed(3));
        setCssVar("--cv-programming-projects-title-scroll-offset", titleScrollOffsetPx.toFixed(2) + "px");
        section.classList.toggle("is-reveal-complete", revealComplete);

        activeFloat = cardPhase * Math.max(0, projects.length - 1);
        activeGroupFloat = getActiveGroupFloat(activeFloat);

        updateCards(activeFloat);
        updateGroupCards(activeGroupFloat);

        if (!stageShown && stageAlpha > 0.22) {
            stageShown = true;
            stage.classList.add("is-visible");
        } else if (stageShown && stageAlpha < 0.06) {
            stageShown = false;
            stage.classList.remove("is-visible");
        }
    }

    function updateTimelineFromDom() {
        var rect = section.getBoundingClientRect();
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        var rawSectionScroll = -rect.top;
        var inViewport = rect.bottom > 0 && rect.top < viewportHeight;

        renderTimeline(rawSectionScroll, viewportHeight, inViewport);

        rafId = null;
    }

    function queueRevealUpdate() {
        if (rafId !== null) {
            return;
        }

        rafId = window.requestAnimationFrame(updateTimelineFromDom);
    }

    function setupGsapScrollDriver() {
        if (
            !gsapApi ||
            !scrollTriggerApi ||
            typeof gsapApi.set !== "function" ||
            typeof scrollTriggerApi.create !== "function"
        ) {
            return false;
        }

        if (typeof gsapApi.registerPlugin === "function") {
            gsapApi.registerPlugin(scrollTriggerApi);
        }

        if (scrollDriver && typeof scrollDriver.kill === "function") {
            scrollDriver.kill();
            scrollDriver = null;
        }

        scrollDriver = scrollTriggerApi.create({
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: function (self) {
                var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
                var rawSectionScroll = Math.max(0, self.scroll() - self.start);
                cachedViewportHeight = 0;
                renderTimeline(rawSectionScroll, viewportHeight, true);
            },
            onUpdate: function (self) {
                var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
                var rawSectionScroll = Math.max(0, self.scroll() - self.start);
                renderTimeline(rawSectionScroll, viewportHeight, true);
            }
        });

        return true;
    }

    function teardownScrollDriver() {
        if (scrollDriver && typeof scrollDriver.kill === "function") {
            scrollDriver.kill();
        }

        scrollDriver = null;
    }

    function applyStaticCardState() {
        cards.forEach(function (card) {
            card.style.removeProperty("transform");
            card.style.removeProperty("opacity");
            card.style.removeProperty("filter");
            card.style.removeProperty("z-index");
            card.style.removeProperty("pointer-events");
            card.setAttribute("aria-hidden", "false");
        });

        groupCards.forEach(function (card) {
            card.style.removeProperty("transform");
            card.style.removeProperty("opacity");
            card.style.removeProperty("filter");
            card.style.removeProperty("z-index");
        });
    }

    function activateMobileLayout() {
        teardownScrollDriver();
        currentLayoutMode = "mobile";
        stageShown = true;
        section.classList.add("is-mobile-layout");
        stage.classList.add("is-visible");
        section.style.minHeight = "";
        setCssVar("--cv-programming-projects-stage-alpha", "1");
        setCssVar("--cv-programming-projects-title-opacity", "1");
        setCssVar("--cv-programming-projects-title-scale", "1");
        setCssVar("--cv-programming-projects-title-x", "0");
        setCssVar("--cv-programming-projects-title-y", "0");
        setCssVar("--cv-programming-projects-title-scroll-offset", "0px");
        applyStaticCardState();
    }

    function activateDesktopLayout() {
        var usingGsap;

        currentLayoutMode = "desktop";
        stageShown = false;
        section.classList.remove("is-mobile-layout");
        stage.classList.remove("is-visible");
        cachedViewportHeight = 0;
        usingGsap = setupGsapScrollDriver();

        if (usingGsap && scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
            scrollTriggerApi.refresh();
            return;
        }

        updateTimelineFromDom();
    }

    function applyResponsiveLayout(force) {
        var nextLayoutMode = mobileLayoutQuery && mobileLayoutQuery.matches ? "mobile" : "desktop";

        if (!force && nextLayoutMode === currentLayoutMode) {
            if (nextLayoutMode === "desktop") {
                if (scrollDriver && scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
                    scrollTriggerApi.refresh();
                } else {
                    updateTimelineFromDom();
                }
            } else {
                activateMobileLayout();
            }
            return;
        }

        if (nextLayoutMode === "mobile") {
            activateMobileLayout();
            return;
        }

        activateDesktopLayout();
    }

    (function bootstrap() {
        var data = parseData();
        var githubIconPath = toPlainObject(data.base.technology_catalog).github
            ? toPlainObject(data.base.technology_catalog).github.icon || ""
            : "";
        var githubAriaLabel = data.i18n.github_link_label || "Open GitHub repository";
        projects = resolveProjects(data);
        if (!projects.length) {
            setCssVar("--cv-programming-projects-stage-alpha", "0");
            heading.style.opacity = "0";
            setCssVar("--cv-programming-projects-title-scroll-offset", "0px");
            return;
        }

        groups = buildGroups(projects);
        renderCards(projects, githubIconPath, githubAriaLabel);
        renderGroupCards(groups);
        applyResponsiveLayout(true);

        window.addEventListener("scroll", function () {
            if (!scrollDriver && currentLayoutMode === "desktop") {
                queueRevealUpdate();
            }
        }, { passive: true });

        window.addEventListener("resize", function () {
            applyResponsiveLayout(false);
        });

        window.addEventListener("load", function () {
            applyResponsiveLayout(false);
        });
    })();
})();
