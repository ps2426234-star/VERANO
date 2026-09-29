console.log("VÉRANO — Tailoring for Presence");

/* =================================
   MOBILE NAV — hamburger toggle
================================= */

(function () {
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");

    if (!toggle || !links) return;

    function closeMenu() {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
    }

    toggle.addEventListener("click", () => {
        const isOpen = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    // Close the drawer once a destination is picked, or on Escape.
    links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", closeMenu)
    );

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });
})();

/* =================================
   ASSEMBLY — scroll-scrubbed suit build
   Frame sequence: 79 alpha-transparent WebP
   frames extracted from the v2 hailuo capture
   (suit-frames/suit-001.webp ... suit-079.webp)

   Frames are only fetched once the visitor is
   about to reach the section (IntersectionObserver
   below) so mobile visitors who never scroll that
   far don't pay for ~3MB of animation frames.
================================= */

(function () {

    const section = document.getElementById("assembly");
    const canvas = document.getElementById("assemblyCanvas");

    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d");
    const progressBar = document.getElementById("assemblyProgressBar");

    const startLabel = section.querySelector(".assembly-label--start");
    const detailsLabel = section.querySelector(".assembly-label--details");
    const finalLabel = section.querySelector(".assembly-label--final");

    const FRAME_COUNT = 79;
    const FRAME_PATH = (i) =>
        `assets/products/suit-frames/suit-${String(i).padStart(3, "0")}.webp`;

    const prefersReducedMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const frames = [];
    let framesLoaded = 0;
    let started = false;

    function loadFrame(i) {
        const img = new Image();
        img.src = FRAME_PATH(i);
        img.onload = () => {
            framesLoaded++;
            if (i === 1) drawFrame(1);
        };
        frames[i - 1] = img;
    }

    function startLoading() {
        if (started) return;
        started = true;

        if (prefersReducedMotion) {
            // Skip the animation entirely: show the finished suit and
            // the closing line, no scroll-linked work, no frame fetching.
            loadFrame(FRAME_COUNT);
            if (finalLabel) finalLabel.classList.add("is-visible");
            return;
        }

        for (let i = 1; i <= FRAME_COUNT; i++) loadFrame(i);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        onScroll();
    }

    // Start fetching frames a little before the section is reached,
    // not on initial page load.
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    startLoading();
                    io.disconnect();
                }
            },
            { rootMargin: "150% 0px 150% 0px" }
        );
        io.observe(section);
    } else {
        startLoading();
    }

    function drawFrame(index) {
        const img = frames[index - 1];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        if (canvas.width !== img.naturalWidth) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }

    function nearestLoadedFrame(target) {
        // If the exact frame hasn't finished loading yet
        // (slow connection), fall back to the closest one that has.
        if (frames[target - 1] && frames[target - 1].complete) return target;

        for (let d = 1; d < FRAME_COUNT; d++) {
            const down = target - d;
            const up = target + d;
            if (down >= 1 && frames[down - 1] && frames[down - 1].complete) return down;
            if (up <= FRAME_COUNT && frames[up - 1] && frames[up - 1].complete) return up;
        }
        return 1;
    }

    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            const rect = section.getBoundingClientRect();
            const sectionHeight = section.offsetHeight;
            const viewportHeight = window.innerHeight;

            const scrollable = sectionHeight - viewportHeight;
            const scrolled = -rect.top;

            let progress = scrollable > 0 ? scrolled / scrollable : 0;
            progress = Math.min(Math.max(progress, 0), 1);

            const frameIndex =
                nearestLoadedFrame(
                    Math.min(
                        FRAME_COUNT,
                        Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1)
                    )
                );

            drawFrame(frameIndex);

            if (progressBar) progressBar.style.width = `${progress * 100}%`;

            toggleLabel(startLabel, progress < 0.06);
            toggleLabel(detailsLabel, progress > 0.55 && progress < 0.9);
            toggleLabel(finalLabel, progress >= 0.92);

            ticking = false;
        });
    }

    function toggleLabel(el, condition) {
        if (!el) return;
        el.classList.toggle("is-visible", condition);
    }

})();
