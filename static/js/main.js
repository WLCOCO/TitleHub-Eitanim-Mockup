/**
 * TitleHub — Main JavaScript
 * 
 * Handles three things:
 *   1. Mobile navigation toggle (hamburger menu)
 *   2. Browse page: search filtering + category pills
 *   3. Flash message auto-dismiss after 4 seconds
 *   4. Scroll-triggered fade-in animations
 */

document.addEventListener("DOMContentLoaded", () => {

    // ── 1. Mobile hamburger toggle ──────────────────
    // Opens/closes the nav links on small screens.

    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            const isOpen = navToggle.getAttribute("aria-expanded") === "true";
            navToggle.setAttribute("aria-expanded", !isOpen);
            navLinks.classList.toggle("open");
        });

        // Close menu when a link is clicked (better mobile UX)
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navToggle.setAttribute("aria-expanded", "false");
                navLinks.classList.remove("open");
            });
        });
    }


    // ── 2. Browse page: search + filter ─────────────
    // Works with both row-based and grid layouts.
    // Filters cards across all content rows and hides
    // entire rows when they have no visible cards.

    const searchInput = document.getElementById("content-search");
    const filterPills = document.querySelectorAll(".filter-pill");
    const contentCards = document.querySelectorAll(".content-card");
    const contentRows = document.querySelectorAll(".content-row");
    const noResults = document.getElementById("no-results");

    let activeFilter = "all";

    // ── Browse page: read selected platforms from sessionStorage ──
    // Hide filter pills for platforms the user didn't select,
    // then store the selection so filterContent can use it.
    let activePlatforms = null;
    if (searchInput) {
        try {
            activePlatforms = JSON.parse(sessionStorage.getItem("th_platforms") || "null");
        } catch (e) { activePlatforms = null; }

        if (activePlatforms && activePlatforms.length > 0) {
            filterPills.forEach(pill => {
                const f = pill.dataset.filter;
                if (f && f !== "all" && f !== "movie" && f !== "show") {
                    if (!activePlatforms.includes(f)) pill.style.display = "none";
                }
            });
        }
    }

    /**
     * Shows or hides each card based on the current
     * search text, the active filter pill, and the
     * user's selected platforms.
     * Also hides entire rows when all cards inside are hidden.
     */
    function filterContent() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
        let visibleCount = 0;

        contentCards.forEach(card => {
            const type = card.dataset.type;
            const platform = card.dataset.platform;
            const title = card.querySelector("h3").textContent.toLowerCase();
            const meta = card.querySelector(".card-meta").textContent.toLowerCase();

            const matchesFilter =
                activeFilter === "all" ||
                type === activeFilter ||
                platform === activeFilter;

            const matchesSearch =
                !query ||
                title.includes(query) ||
                meta.includes(query) ||
                platform.includes(query);

            const matchesPlatformSelection =
                !activePlatforms || activePlatforms.includes(platform);

            const isVisible = matchesFilter && matchesSearch && matchesPlatformSelection;
            card.style.display = isVisible ? "" : "none";

            if (isVisible) visibleCount++;
        });

        // Hide entire row sections when they have no visible cards
        contentRows.forEach(row => {
            const visibleInRow = row.querySelectorAll(".content-card:not([style*='display: none'])");
            row.style.display = visibleInRow.length > 0 ? "" : "none";
        });

        if (noResults) {
            noResults.hidden = visibleCount > 0;
        }
    }

    // Wire up search input
    if (searchInput) {
        searchInput.addEventListener("input", filterContent);
    }

    // Wire up filter pills
    filterPills.forEach(pill => {
        pill.addEventListener("click", () => {
            const isAlreadyActive = pill.classList.contains("active");
            filterPills.forEach(p => p.classList.remove("active"));
            if (isAlreadyActive) {
                // Deselect — revert to "All"
                document.querySelector('.filter-pill[data-filter="all"]')?.classList.add("active");
                activeFilter = "all";
            } else {
                pill.classList.add("active");
                activeFilter = pill.dataset.filter;
            }
            filterContent();
        });
    });


    // ── 3. Auto-dismiss flash messages ──────────────
    // Gives the user time to read, then smoothly fades out.

    document.querySelectorAll(".flash").forEach(flash => {
        setTimeout(() => {
            flash.style.transition = "opacity 0.4s ease";
            flash.style.opacity = "0";
            // Remove from DOM after fade completes
            setTimeout(() => flash.remove(), 400);
        }, 4000);
    });


    // ── 4. Scroll-triggered fade-in ─────────────────
    // Cards and sections gently appear as user scrolls.

    const fadeTargets = document.querySelectorAll(
        ".step-card, .feature-card, .pricing-card, .platform-chip, .content-row"
    );

    fadeTargets.forEach(el => el.classList.add("fade-in"));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    fadeTargets.forEach(el => observer.observe(el));


    // ── 5. YouTube trailer preview on hover ─────────
    // On mouseenter, injects a muted autoplay YouTube iframe
    // into the card poster. On mouseleave, removes it.

    let hoverTimer = null;

    contentCards.forEach(card => {
        const trailerId = card.dataset.trailer;
        if (!trailerId) return;

        const poster = card.querySelector(".card-poster");
        if (!poster) return;

        card.addEventListener("mouseenter", () => {
            // Small delay so quick scroll-bys don't trigger loads
            hoverTimer = setTimeout(() => {
                // Avoid duplicates
                if (poster.querySelector(".card-trailer-overlay")) return;

                const overlay = document.createElement("div");
                overlay.className = "card-trailer-overlay";
                overlay.innerHTML =
                    `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(trailerId)}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${encodeURIComponent(trailerId)}&start=5" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
                poster.appendChild(overlay);

                // Trigger the CSS opacity transition
                requestAnimationFrame(() => overlay.classList.add("active"));
            }, 600);
        });

        card.addEventListener("mouseleave", () => {
            clearTimeout(hoverTimer);
            const overlay = poster.querySelector(".card-trailer-overlay");
            if (overlay) {
                overlay.classList.remove("active");
                setTimeout(() => overlay.remove(), 250);
            }
        });
    });


    // ── 6. Onboarding Modal ──────────────────────────
    // Four-step flow: Account → Plan → Platforms → Payment.
    // State lives only in JS vars; persisted to sessionStorage
    // after payment so browse.html can filter by platform.

    const PLATFORMS = [
        { id: "netflix", label: "Netflix", color: "#e50914", abbr: "N" },
        { id: "hulu", label: "Hulu", color: "#1ce783", abbr: "H" },
        { id: "disney", label: "Disney+", color: "#113ccf", abbr: "D+" },
        { id: "max", label: "Max", color: "#6c2dc7", abbr: "M" },
        { id: "paramount", label: "Paramount+", color: "#0064ff", abbr: "P+" },
        { id: "prime", label: "Prime Video", color: "#00a8e0", abbr: "PV" },
        { id: "peacock", label: "Peacock", color: "#e8501a", abbr: "PC" },
        { id: "appletv", label: "Apple TV+", color: "#444444", abbr: "TV+" },
        { id: "crunchyroll", label: "Crunchyroll", color: "#f47521", abbr: "CR" },
        { id: "espnplus", label: "ESPN+", color: "#cc0000", abbr: "E+" },
        { id: "foxsports", label: "Fox Sports", color: "#0b3d91", abbr: "FOX" },
        { id: "fubotv", label: "FuboTV", color: "#b70000", abbr: "fubo" },
    ];

    const obOverlay = document.getElementById("ob-overlay");
    const obCloseBtn = document.getElementById("ob-close");
    const openObBtn = document.getElementById("open-onboarding");
    const ctaStartBtn = document.getElementById("cta-start");

    let obPlan = null;
    let obLimit = 0;
    let obSelected = [];   // selected platform IDs

    function obGoStep(n) {
        document.querySelectorAll(".ob-step").forEach(s => s.classList.remove("ob-step--active"));
        const target = document.getElementById("ob-step-" + n);
        if (target) target.classList.add("ob-step--active");
        document.querySelectorAll(".ob-dot").forEach((dot, i) => {
            dot.classList.toggle("ob-dot--active", i < n);
        });
        // Scroll the full-screen overlay back to top on step change
        const overlay = document.getElementById("ob-overlay");
        if (overlay) overlay.scrollTop = 0;
    }

    function obOpen() {
        if (!obOverlay) return;
        obPlan = null; obLimit = 0; obSelected = [];
        obOverlay.hidden = false;
        document.body.classList.add("ob-body-lock");
        obGoStep(1);
    }

    function obCloseFn() {
        if (!obOverlay) return;
        obOverlay.hidden = true;
        document.body.classList.remove("ob-body-lock");
    }

    if (openObBtn) openObBtn.addEventListener("click", obOpen);
    if (ctaStartBtn) ctaStartBtn.addEventListener("click", function (e) { e.preventDefault(); obOpen(); });
    if (obCloseBtn) obCloseBtn.addEventListener("click", obCloseFn);
    if (obOverlay) {
        obOverlay.addEventListener("click", (e) => {
            if (e.target === obOverlay) obCloseFn();
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && obOverlay && !obOverlay.hidden) {
            obCloseFn();
        }
    });

    // Auto-open when arriving from signup/login nav link (?onboard=1)
    if (new URLSearchParams(window.location.search).get("onboard") === "1") {
        obOpen();
    }

    // Step 1 → Step 2: signup form submit (no validation needed for beta)
    document.getElementById("ob-signup-form")?.addEventListener("submit", e => {
        e.preventDefault();
        obGoStep(2);
    });

    // Step 2: plan card click → Step 3
    document.querySelectorAll(".ob-plan-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll(".ob-plan-card").forEach(c => c.classList.remove("ob-plan-selected"));
            card.classList.add("ob-plan-selected");
            obPlan = card.dataset.plan;
            obLimit = parseInt(card.dataset.limit, 10);
            obSelected = [];
            buildPlatformGrid();
            obGoStep(3);
        });
    });

    function buildPlatformGrid() {
        const grid = document.getElementById("ob-platforms-grid");
        const limitEl = document.getElementById("ob-limit-num");
        if (!grid) return;
        if (limitEl) limitEl.textContent = obLimit >= PLATFORMS.length ? "all" : obLimit;
        grid.innerHTML = "";

        PLATFORMS.forEach(p => {
            const card = document.createElement("div");
            card.className = "ob-plat-card";
            card.dataset.id = p.id;
            card.innerHTML = `
                <div class="ob-plat-logo" style="background:${p.color}"> 
                    <span class="ob-plat-abbr">${p.abbr}</span>
                </div>
                <span class="ob-plat-label">${p.label}</span>
                <span class="ob-plat-check" aria-hidden="true">✓</span>`;  //Add href for div elements and change div to a tags and use a list at the top to make a url dict
            card.addEventListener("click", () => {
                const isSelected = obSelected.includes(p.id);
                if (isSelected) {
                    obSelected = obSelected.filter(x => x !== p.id);
                } else {
                    if (obSelected.length >= obLimit) return;
                    obSelected.push(p.id);
                }
                syncPlatformStates();
            });
            grid.appendChild(card);
        });

        // Wire carousel arrow buttons
        const prevBtn = document.getElementById("ob-plat-prev");
        const nextBtn = document.getElementById("ob-plat-next");
        const SCROLL_AMOUNT = 300;
        if (prevBtn) prevBtn.onclick = () => grid.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
        if (nextBtn) nextBtn.onclick = () => grid.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });

        syncPlatformStates();
    }

    function syncPlatformStates() {
        const atLimit = obSelected.length >= obLimit;
        document.querySelectorAll(".ob-plat-card").forEach(card => {
            const id = card.dataset.id;
            const isSelected = obSelected.includes(id);
            card.classList.toggle("ob-plat-card--selected", isSelected);
            card.classList.toggle("ob-plat-card--dim", !isSelected && atLimit);
        });
        const confirmBtn = document.getElementById("ob-confirm-plats");
        if (confirmBtn) confirmBtn.disabled = obSelected.length === 0;
    }

    document.getElementById("ob-confirm-plats")?.addEventListener("click", () => obGoStep(4));

    // Step 4: payment form submit → save to sessionStorage → go to browse
    document.getElementById("ob-payment-form")?.addEventListener("submit", e => {
        e.preventDefault();
        sessionStorage.setItem("th_platforms", JSON.stringify(obSelected));
        sessionStorage.setItem("th_plan", obPlan);
        window.location.href = "/browse";
    });

    // Trigger initial filter on browse page so only selected-platform cards show
    if (activePlatforms && activePlatforms.length > 0) {
        filterContent();
    }

});