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
    const devMode = sessionStorage.getItem("th_dev_mode") === "1";
    if (searchInput) {
        try {
            activePlatforms = JSON.parse(sessionStorage.getItem("th_platforms") || "null");
        } catch (e) { activePlatforms = null; }

        // In dev mode all platform pills stay visible; otherwise hide unselected ones
        if (!devMode && activePlatforms && activePlatforms.length > 0) {
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
                devMode || !activePlatforms || activePlatforms.includes(platform);

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
                    `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(trailerId)}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${encodeURIComponent(trailerId)}" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
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
        { id: "netflix", label: "Netflix", color: "#e50914", abbr: "N", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/netflix.svg" },
        { id: "hulu", label: "Hulu", color: "#1ce783", abbr: "H", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/hulu.svg" },
        { id: "disney", label: "Disney+", color: "#113ccf", abbr: "D+", logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/Disney%2B_2024.svg" },
        { id: "max", label: "Max", color: "#6c2dc7", abbr: "M", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/max.svg" },
        { id: "paramount", label: "Paramount+", color: "#0064ff", abbr: "P+", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/paramountplus.svg" },
        { id: "prime", label: "Prime Video", color: "#00a8e0", abbr: "PV", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/primevideo.svg" },
        { id: "peacock", label: "Peacock", color: "#e8501a", abbr: "PC", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg" },
        { id: "appletv", label: "Apple TV+", color: "#444444", abbr: "TV+", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/appletv.svg" },
        { id: "crunchyroll", label: "Crunchyroll", color: "#f47521", abbr: "CR", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/crunchyroll.svg" },
        { id: "espnplus", label: "ESPN+", color: "#cc0000", abbr: "E+", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/ESPN_wordmark.svg" },
        { id: "foxsports", label: "Fox Sports", color: "#0b3d91", abbr: "FOX", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Fox_Sports_wordmark_logo.svg/330px-Fox_Sports_wordmark_logo.svg.png" },
        { id: "fubotv", label: "FuboTV", color: "#b70000", abbr: "fubo", logo: "https://cdn.jsdelivr.net/npm/simple-icons/icons/fubo.svg" },
    ];

    const PLAN_DETAILS = {
        starter: {
            price: "$24.99",
            platforms: "Up to 3 streaming services",
            resolution: "1080p HD",
            devices: "1 device at once"
        },
        standard: {
            price: "$32.99",
            platforms: "Up to 4 streaming services",
            resolution: "1080p HD",
            devices: "2 devices at once"
        },
        unlimited: {
            price: "$41.99",
            platforms: "All available streaming services",
            resolution: "4K Ultra HD + HDR",
            devices: "4 devices at once"
        }
    };

    const obOverlay = document.getElementById("ob-overlay");
    const obCloseBtn = document.getElementById("ob-close");
    const openObBtn = document.getElementById("open-onboarding");
    const ctaStartBtn = document.getElementById("cta-start");

    let obPlan = null;
    let obLimit = 0;
    let obSelected = [];   // selected platform IDs

    function setPlanDetails(planId) {
        const details = PLAN_DETAILS[planId];
        const selectedCard = document.querySelector(`.ob-plan-card[data-plan="${planId}"]`);
        if (!details || !selectedCard) return;

        document.querySelectorAll(".ob-plan-card").forEach(card => {
            const isSelected = card.dataset.plan === planId;
            card.classList.toggle("ob-plan-selected", isSelected);
            card.setAttribute("aria-pressed", String(isSelected));
        });

        obPlan = planId;
        obLimit = parseInt(selectedCard.dataset.limit, 10);

        const detailMap = {
            "ob-detail-price": details.price,
            "ob-detail-platforms": details.platforms,
            "ob-detail-resolution": details.resolution,
            "ob-detail-devices": details.devices,
        };

        Object.entries(detailMap).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

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
        document.querySelectorAll(".ob-plan-card").forEach(card => {
            card.classList.remove("ob-plan-selected");
            card.setAttribute("aria-pressed", "false");
        });
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
        setPlanDetails("standard");
        obGoStep(2);
    });

    // Step 2: plan card click → update detail panel
    document.querySelectorAll(".ob-plan-card").forEach(card => {
        const choosePlan = () => setPlanDetails(card.dataset.plan);
        card.addEventListener("click", choosePlan);
        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                choosePlan();
            }
        });
    });

    document.getElementById("ob-confirm-plan")?.addEventListener("click", () => {
        if (!obPlan) setPlanDetails("standard");
        obSelected = [];
        buildPlatformGrid();
        obGoStep(3);
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
                <div class="ob-plat-logo">
                    <img src="${p.logo}" alt="${p.label} logo" class="ob-plat-img">
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
        window.location.href = "browse.html";
    });

    // Trigger initial filter on browse page so only selected-platform cards show
    if (activePlatforms && activePlatforms.length > 0 || devMode) {
        filterContent();
    }


    // ── 7. Dev-mode secret toggle ────────────────────
    // Type "showme" anywhere on the page (not inside an input/textarea)
    // to instantly bypass the login flow and show all platforms at once.
    // Type "showme" again to turn it off and return to the home page.
    // A small toast confirms the state change.

    (function () {
        const CODE = "showme";
        let buf = "";

        function devToast(msg) {
            const el = document.createElement("div");
            el.textContent = msg;
            Object.assign(el.style, {
                position: "fixed",
                bottom: "24px",
                right: "24px",
                background: "#1a1a2e",
                color: "#a78bfa",
                border: "1px solid #7c3aed",
                borderRadius: "8px",
                padding: "10px 18px",
                fontFamily: "monospace",
                fontSize: "13px",
                zIndex: "9999",
                pointerEvents: "none",
                opacity: "1",
                transition: "opacity 0.5s ease",
            });
            document.body.appendChild(el);
            setTimeout(() => { el.style.opacity = "0"; }, 2000);
            setTimeout(() => el.remove(), 2600);
        }

        document.addEventListener("keydown", function (e) {
            // Ignore keypresses that land inside form fields
            const tag = document.activeElement ? document.activeElement.tagName : "";
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            // Only single printable characters advance the buffer
            if (e.key.length !== 1) { buf = ""; return; }
            buf = (buf + e.key.toLowerCase()).slice(-CODE.length);

            if (buf === CODE) {
                buf = "";
                const isOn = sessionStorage.getItem("th_dev_mode") === "1";
                if (isOn) {
                    sessionStorage.removeItem("th_dev_mode");
                    sessionStorage.removeItem("th_platforms");
                    devToast("Dev mode OFF");
                    setTimeout(() => window.location.replace("index.html"), 700);
                } else {
                    sessionStorage.setItem("th_dev_mode", "1");
                    devToast("Dev mode ON — all platforms unlocked");
                    const path = window.location.pathname;
                    if (path.endsWith("/browse.html") || path === "/browse") {
                        setTimeout(() => window.location.reload(), 700);
                    } else {
                        setTimeout(() => { window.location.href = "browse.html"; }, 700);
                    }
                }
            }
        });
    }());

});