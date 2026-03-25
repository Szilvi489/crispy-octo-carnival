(function () {
    var section = document.getElementById("cv-skills");
    var programmingProjectsSection = document.getElementById("cv-programming-projects");
    var title = section ? section.querySelector(".cv-skills-title") : null;
    var grid = section ? section.querySelector(".cv-skills-grid") : null;
    var hoverCard = section ? section.querySelector(".cv-skills-hover-card") : null;
    var skillsDataNode = section ? section.querySelector("#cv-skills-data") : null;
    var rafId = null;
    var activeSkill = null;
    var activePointer = { x: 0, y: 0 };
    var neonBaseRgb = null;
    var neonBaseHsl = null;
    var scoreExponent = 2.35;
    var minimumWeight = 0.02;
    var knowledgeLabel = skillsDataNode ? (skillsDataNode.dataset.knowledgeLabel || "Knowledge") : "Knowledge";
    var noteFallback = skillsDataNode ? (skillsDataNode.dataset.noteFallback || "Add your note in the CV language data file.") : "Add your note in the CV language data file.";
    var ariaLabelSuffix = skillsDataNode ? (skillsDataNode.dataset.ariaLabelSuffix || "skill") : "skill";

    var skills = [
        { name: "Jakarta EE", score: 25, logo: "", note: "" },
        { name: "Postman API", score: 50, logo: "", note: "" },
        { name: "Camunda BPM", score: 50, logo: "", note: "" },
        { name: "Vaadin", score: 50, logo: "", note: "" },
        { name: "Git", score: 20, logo: "", note: "" },
        { name: "Maven", score: 30, logo: "", note: "" },
        { name: "JUnit", score: 50, logo: "", note: "" },
        { name: "SoapUI", score: 50, logo: "", note: "" },
        { name: "SOAP", score: 70, logo: "", note: "" },
        { name: "OpenAPI", score: 80, logo: "", note: "" },
        { name: "Cypress", score: 50, logo: "", note: "" },
        { name: "Jasmine Framework", score: 50, logo: "", note: "" },
        { name: "REST APIs", score: 50, logo: "", note: "" },
        { name: "Unit Testing", score: 50, logo: "", note: "" },
        { name: "End-to-end Testing", score: 50, logo: "", note: "" },
        { name: "Selenium", score: 50, logo: "", note: "" },
        { name: "TestNG", score: 50, logo: "", note: "" },
        { name: "Batch Processing", score: 50, logo: "", note: "" },
        { name: "Podman", score: 25, logo: "", note: "" },
        { name: "Velocity", score: 50, logo: "", note: "" },
        { name: "Content Management Systems (CMS)", score: 50, logo: "", note: "" },
        { name: "Requirements Engineering", score: 50, logo: "", note: "" },
        { name: "Software Engineering Practices", score: 50, logo: "", note: "" },
        { name: "ISTQB", score: 50, logo: "", note: "" },
        { name: "Quality Assurance", score: 50, logo: "", note: "" },
        { name: "IREB", score: 50, logo: "", note: "" },
        { name: "Testing Strategies", score: 50, logo: "", note: "" },
        { name: "Quality Management", score: 50, logo: "", note: "" },
        { name: "Scrum", score: 89, logo: "", note: "" },
        { name: "SQL", score: 50, logo: "", note: "" },
        { name: "Java", score: 50, logo: "", note: "" },
        { name: "Relational Databases", score: 50, logo: "", note: "" },
        { name: "Project Management", score: 50, logo: "", note: "" },
        { name: "CCNA", score: 50, logo: "", note: "" },
        { name: "HTML", score: 25, logo: "", note: "" },
        { name: "Data Modeling", score: 30, logo: "", note: "" },
        { name: "CSS", score: 25, logo: "", note: "" },
        { name: "JavaScript", score: 50, logo: "", note: "" }
    ];

    if (!section || !title || !grid || !hoverCard) {
        return;
    }

    if (hoverCard.parentElement !== document.body) {
        document.body.appendChild(hoverCard);
    }

    if (skillsDataNode) {
        try {
            skills = JSON.parse(skillsDataNode.textContent || "[]");
        } catch (error) {
            skills = skills;
        }
    }

    neonBaseRgb = parseRgb(colorFromVar("--color-trendy-neon-green")) || { r: 27, g: 238, b: 7 };
    neonBaseHsl = rgbToHsl(neonBaseRgb) || { h: 114, s: 94, l: 48 };

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function sumWeights(items) {
        return items.reduce(function (total, item) {
            return total + item.weight;
        }, 0);
    }

    function getAcronym(name) {
        return name
            .split(/[\s/()-]+/)
            .filter(Boolean)
            .slice(0, 3)
            .map(function (part) { return part.charAt(0); })
            .join("")
            .toUpperCase();
    }

    function colorFromVar(name) {
        var value = getComputedStyle(document.documentElement).getPropertyValue(name) || "";
        return value.trim();
    }

    function parseRgb(color) {
        var match = color.match(/rgba?\(([^)]+)\)/i);
        var parts;
        if (!match) {
            return null;
        }
        parts = match[1].split(",").map(function (part) {
            return Number(part.trim());
        });
        return {
            r: parts[0] || 0,
            g: parts[1] || 0,
            b: parts[2] || 0
        };
    }

    function getLuminance(rgb) {
        if (!rgb) {
            return 0;
        }
        return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    }

    function rgbToHsl(rgb) {
        var r;
        var g;
        var b;
        var max;
        var min;
        var delta;
        var h = 0;
        var s = 0;
        var l;

        if (!rgb) {
            return null;
        }

        r = clamp(rgb.r, 0, 255) / 255;
        g = clamp(rgb.g, 0, 255) / 255;
        b = clamp(rgb.b, 0, 255) / 255;
        max = Math.max(r, g, b);
        min = Math.min(r, g, b);
        delta = max - min;
        l = (max + min) / 2;

        if (delta > 0) {
            s = delta / (1 - Math.abs((2 * l) - 1));
            if (max === r) {
                h = ((g - b) / delta) % 6;
            } else if (max === g) {
                h = ((b - r) / delta) + 2;
            } else {
                h = ((r - g) / delta) + 4;
            }
            h *= 60;
            if (h < 0) {
                h += 360;
            }
        }

        return {
            h: h,
            s: s * 100,
            l: l * 100
        };
    }

    function hueToRgb(p, q, t) {
        var wrapped = t;
        if (wrapped < 0) {
            wrapped += 1;
        }
        if (wrapped > 1) {
            wrapped -= 1;
        }
        if (wrapped < (1 / 6)) {
            return p + ((q - p) * 6 * wrapped);
        }
        if (wrapped < (1 / 2)) {
            return q;
        }
        if (wrapped < (2 / 3)) {
            return p + ((q - p) * ((2 / 3) - wrapped) * 6);
        }
        return p;
    }

    function hslToRgb(h, s, l) {
        var hue = ((h % 360) + 360) % 360;
        var sat = clamp(s, 0, 100) / 100;
        var light = clamp(l, 0, 100) / 100;
        var q;
        var p;
        var r;
        var g;
        var b;

        if (sat === 0) {
            r = light;
            g = light;
            b = light;
        } else {
            q = light < 0.5 ? light * (1 + sat) : (light + sat - (light * sat));
            p = (2 * light) - q;
            r = hueToRgb(p, q, (hue / 360) + (1 / 3));
            g = hueToRgb(p, q, (hue / 360));
            b = hueToRgb(p, q, (hue / 360) - (1 / 3));
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function rgbToCss(rgb) {
        return "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
    }

    function getTileColorForScore(rawScore) {
        var normalized = clamp((Number(rawScore) || 0) / 100, 0, 1);
        var hue = neonBaseHsl.h - 9 + (normalized * 18);
        var saturation = clamp(neonBaseHsl.s - 16 + (normalized * 14), 48, 100);
        var lightness = clamp(84 - (normalized * 52), 28, 88);
        return rgbToCss(hslToRgb(hue, saturation, lightness));
    }

    function computeWeightedRects(items, x, y, width, height, output) {
        var totalWeight;
        var targetHalf;
        var cumulative;
        var splitIndex;
        var i;
        var groupA;
        var groupB;
        var weightA;
        var splitSize;

        if (!items.length || width <= 0 || height <= 0) {
            return;
        }

        if (items.length === 1) {
            output.push({
                index: items[0].index,
                x: x,
                y: y,
                width: width,
                height: height
            });
            return;
        }

        totalWeight = sumWeights(items);

        if (totalWeight <= 0) {
            splitIndex = Math.floor(items.length / 2);
            groupA = items.slice(0, splitIndex);
            groupB = items.slice(splitIndex);
            if (width >= height) {
                splitSize = width * (groupA.length / items.length);
                computeWeightedRects(groupA, x, y, splitSize, height, output);
                computeWeightedRects(groupB, x + splitSize, y, width - splitSize, height, output);
            } else {
                splitSize = height * (groupA.length / items.length);
                computeWeightedRects(groupA, x, y, width, splitSize, output);
                computeWeightedRects(groupB, x, y + splitSize, width, height - splitSize, output);
            }
            return;
        }

        targetHalf = totalWeight / 2;
        cumulative = 0;
        splitIndex = 1;

        for (i = 0; i < items.length - 1; i += 1) {
            cumulative += items[i].weight;
            splitIndex = i + 1;
            if (cumulative >= targetHalf) {
                break;
            }
        }

        groupA = items.slice(0, splitIndex);
        groupB = items.slice(splitIndex);
        weightA = sumWeights(groupA);

        if (width >= height) {
            splitSize = width * (weightA / totalWeight);
            computeWeightedRects(groupA, x, y, splitSize, height, output);
            computeWeightedRects(groupB, x + splitSize, y, width - splitSize, height, output);
        } else {
            splitSize = height * (weightA / totalWeight);
            computeWeightedRects(groupA, x, y, width, splitSize, output);
            computeWeightedRects(groupB, x, y + splitSize, width, height - splitSize, output);
        }
    }

    function layoutTiles() {
        var gridRect = grid.getBoundingClientRect();
        var width = gridRect.width;
        var height = gridRect.height;
        var weightedItems;
        var rects = [];
        var byXOrder;
        var i;

        if (width < 2 || height < 2) {
            return;
        }

        weightedItems = skills
            .map(function (skill, index) {
                var score = clamp(Number(skill.score) || 0, 0, 100);
                var normalized = score / 100;
                return {
                    index: index,
                    /* Nonlinear sizing: raises contrast between low/high scores. */
                    weight: minimumWeight + Math.pow(normalized, scoreExponent)
                };
            })
            .sort(function (a, b) { return b.weight - a.weight; });

        computeWeightedRects(weightedItems, 0, 0, width, height, rects);

        rects.forEach(function (rect) {
            var tile = grid.children[rect.index];

            if (!tile) {
                return;
            }

            tile.style.left = rect.x.toFixed(2) + "px";
            tile.style.top = rect.y.toFixed(2) + "px";
            tile.style.width = rect.width.toFixed(2) + "px";
            tile.style.height = rect.height.toFixed(2) + "px";
        });

        byXOrder = rects.slice().sort(function (a, b) {
            if (Math.abs(b.x - a.x) > 0.5) {
                return b.x - a.x;
            }
            return a.y - b.y;
        });

        for (i = 0; i < byXOrder.length; i += 1) {
            var tile = grid.children[byXOrder[i].index];
            if (!tile) {
                continue;
            }
            tile.style.setProperty("--tile-order", String(i));
        }
    }

    function renderHoverCard(skill) {
        var note = skill.note && skill.note.trim()
            ? skill.note.trim()
            : noteFallback;

        hoverCard.innerHTML = [
            "<h3 class=\"cv-skills-hover-title\">", skill.name, "</h3>",
            "<p class=\"cv-skills-hover-meta\">", knowledgeLabel, " ", String(skill.score), " / 100</p>",
            "<p class=\"cv-skills-hover-note\">", note, "</p>"
        ].join("");
    }

    function positionHoverCard(clientX, clientY) {
        var margin = 12;
        var offset = 16;
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        var rect = hoverCard.getBoundingClientRect();
        var x = clientX + offset;
        var y = clientY + offset;

        if (x + rect.width + margin > viewportWidth) {
            x = clientX - rect.width - offset;
        }

        if (y + rect.height + margin > viewportHeight) {
            y = clientY - rect.height - offset;
        }

        x = clamp(x, margin, viewportWidth - rect.width - margin);
        y = clamp(y, margin, viewportHeight - rect.height - margin);

        hoverCard.style.transform = "translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, 0)";
    }

    function showHoverCard(skill, clientX, clientY) {
        activeSkill = skill;
        activePointer.x = clientX;
        activePointer.y = clientY;
        renderHoverCard(skill);
        hoverCard.hidden = false;
        hoverCard.classList.add("is-visible");
        positionHoverCard(clientX, clientY);
    }

    function hideHoverCard() {
        activeSkill = null;
        hoverCard.classList.remove("is-visible");
        hoverCard.hidden = true;
    }

    function createSkillTile(skill, index) {
        var tile = document.createElement("button");
        var name = document.createElement("span");
        var score = document.createElement("span");
        var logoImage;
        var logoFallback;
        var tileColor = getTileColorForScore(skill.score);
        var luminance = getLuminance(parseRgb(tileColor));
        var foreground = luminance > 0.57 ? "rgb(43, 27, 27)" : "rgb(245, 243, 239)";
        var border = luminance > 0.57 ? "rgba(43, 27, 27, 0.46)" : "rgba(245, 243, 239, 0.34)";

        tile.type = "button";
        tile.className = "cv-skill-tile";
        tile.style.setProperty("--tile-order", String(skills.length - index - 1));
        tile.style.setProperty("--tile-bg", tileColor);
        tile.style.setProperty("--tile-fg", foreground);
        tile.style.setProperty("--tile-border", border);
        tile.setAttribute("aria-label", skill.name + " " + ariaLabelSuffix);
        tile.dataset.breakSpread = String(Math.random());
        tile.dataset.breakLift = String(Math.random());
        tile.dataset.breakSpin = String(Math.random());
        tile.dataset.breakFade = String(Math.random());

        if (skill.logo && skill.logo.trim()) {
            logoImage = document.createElement("img");
            logoImage.className = "cv-skill-tile-logo";
            logoImage.src = skill.logo.trim();
            logoImage.alt = "";
            logoImage.loading = "lazy";
            tile.appendChild(logoImage);
        } else {
            logoFallback = document.createElement("span");
            logoFallback.className = "cv-skill-tile-logo-fallback";
            logoFallback.textContent = getAcronym(skill.name);
            tile.appendChild(logoFallback);
        }

        name.className = "cv-skill-tile-name";
        name.textContent = skill.name;
        tile.appendChild(name);

        score.className = "cv-skill-score";
        score.textContent = String(skill.score) + "%";
        tile.appendChild(score);

        tile.addEventListener("pointerenter", function (event) {
            if (event.pointerType === "touch") {
                return;
            }
            showHoverCard(skill, event.clientX, event.clientY);
        });

        tile.addEventListener("pointermove", function (event) {
            if (!activeSkill || event.pointerType === "touch") {
                return;
            }
            activePointer.x = event.clientX;
            activePointer.y = event.clientY;
            positionHoverCard(event.clientX, event.clientY);
        });

        tile.addEventListener("pointerleave", hideHoverCard);
        tile.addEventListener("blur", hideHoverCard);

        tile.addEventListener("focus", function () {
            var rect = tile.getBoundingClientRect();
            showHoverCard(skill, rect.right + 10, rect.top + 10);
        });

        return tile;
    }

    function renderSkillTiles() {
        var fragment = document.createDocumentFragment();

        skills.forEach(function (skill, index) {
            fragment.appendChild(createSkillTile(skill, index));
        });

        grid.textContent = "";
        grid.appendChild(fragment);
        layoutTiles();
    }

    function getBreakupProgress(viewportHeight) {
        var projectsRect;
        var fadeStart;
        var fadeEnd;
        var raw;

        if (!programmingProjectsSection) {
            return 0;
        }

        projectsRect = programmingProjectsSection.getBoundingClientRect();
        fadeStart = viewportHeight * 0.9; /* projects entered ~10% */
        fadeEnd = viewportHeight * 0.22;
        raw = (fadeStart - projectsRect.top) / Math.max(1, fadeStart - fadeEnd);
        return clamp(raw, 0, 1);
    }

    function resetTileBreakup() {
        Array.prototype.forEach.call(grid.children, function (tile) {
            tile.style.removeProperty("transform");
            tile.style.removeProperty("opacity");
            tile.style.removeProperty("pointer-events");
        });
    }

    function applyTileBreakup(progress) {
        var gridRect = grid.getBoundingClientRect();
        var gridMidX = gridRect.left + (gridRect.width / 2);
        var eased = Math.pow(progress, 1.16);

        Array.prototype.forEach.call(grid.children, function (tile) {
            var rect = tile.getBoundingClientRect();
            var centerX = rect.left + (rect.width / 2);
            var direction = centerX < gridMidX ? -1 : 1;
            var spread = Number(tile.dataset.breakSpread || 0.5);
            var lift = Number(tile.dataset.breakLift || 0.5);
            var spin = Number(tile.dataset.breakSpin || 0.5);
            var fade = Number(tile.dataset.breakFade || 0.5);
            var x = direction * (96 + (spread * 260)) * eased;
            var y = -(54 + (lift * 220)) * eased;
            var rotate = direction * (8 + (spin * 26)) * eased;
            var scale = 1 - ((0.06 + (fade * 0.12)) * eased);
            var opacity = clamp(1 - ((0.68 + (fade * 0.28)) * eased), 0, 1);

            tile.style.transform = "translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, 0) rotate(" + rotate.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
            tile.style.opacity = opacity.toFixed(3);
            tile.style.pointerEvents = progress > 0.06 ? "none" : "";
        });
    }

    function updateSkillsState() {
        var rect = section.getBoundingClientRect();
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        var raw = (viewportHeight - rect.top) / (viewportHeight * 0.9);
        var progress = clamp(raw, 0, 1);
        var exitStart = viewportHeight * 0.15;
        var exitRaw = rect.top <= exitStart ? (exitStart - rect.top) / (viewportHeight * 0.45) : 0;
        var exitProgress = clamp(exitRaw, 0, 1);
        var exitX = -(exitProgress * 120);
        var showTiles = rect.top <= (viewportHeight * 0.5);
        var breakupProgress = getBreakupProgress(viewportHeight);

        title.style.setProperty("--skills-fill-progress", (progress * 100).toFixed(2) + "%");
        title.style.setProperty("--skills-exit-x", exitX.toFixed(2) + "vw");
        section.classList.toggle("skills-tiles-visible", showTiles);
        section.classList.toggle("skills-breakup-active", breakupProgress > 0);

        if (breakupProgress > 0 && showTiles) {
            hideHoverCard();
            applyTileBreakup(breakupProgress);
        } else {
            resetTileBreakup();
        }

        if (activeSkill && !hoverCard.hidden) {
            positionHoverCard(activePointer.x, activePointer.y);
        }

        rafId = null;
    }

    function queueUpdate() {
        if (rafId !== null) {
            return;
        }
        rafId = window.requestAnimationFrame(updateSkillsState);
    }

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", function () {
        layoutTiles();
        queueUpdate();
    });

    renderSkillTiles();
    updateSkillsState();
})();
