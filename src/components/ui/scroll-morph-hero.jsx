import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue, useAnimationFrame } from "framer-motion";

const TOTAL_IMAGES = 15;
const MAX_SCROLL = 1200;

// Card geometry is DERIVED from the ring, not hardcoded, so cards can never overlap:
// the cards must fit around the circumference with real gaps between them.
const CARD_ASPECT = 1.4; // height / width
const RING_FILL = 0.7; // fraction of circumference occupied by cards; the rest is gaps
const CARD_MIN_W = 56;
const CARD_MAX_W = 130;
const EDGE_MARGIN = 2; // breathing room so the outermost cards just kiss the hero edges

// Idle spin
const SPIN_DEG_PER_SEC = 6; // one slow revolution per minute
const SPIN_RESUME_DELAY = 600; // ms of no scrolling before the spin picks back up

/**
 * Solves radius and card size together so the ring fills the hero's full height:
 * cardW = 2πR·FILL / N  and  cardH = ASPECT·cardW, so cardH = k·R.
 * Filling the height means R + cardH/2 = height/2  →  R = height / (2 + k).
 */
function solveRingGeometry(width, height) {
  const usable = Math.max(280, height - EDGE_MARGIN * 2);
  const k = (CARD_ASPECT * 2 * Math.PI * RING_FILL) / TOTAL_IMAGES;

  let radius = usable / (2 + k);
  radius = Math.min(radius, width * 0.36); // never wider than the viewport allows

  let cardW = (2 * Math.PI * radius * RING_FILL) / TOTAL_IMAGES;
  cardW = Math.max(CARD_MIN_W, Math.min(CARD_MAX_W, cardW));
  const cardH = cardW * CARD_ASPECT;

  // Final clamp: the outermost card edge sits exactly on the hero's top/bottom edge.
  radius = Math.min(radius, usable / 2 - cardH / 2);

  return { radius, card: { w: cardW, h: cardH } };
}

// Wikimedia Commons landmark photos (330px is a permitted thumbnail width).
const IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/330px-Tour_Eiffel_Wikimedia_Commons.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/330px-Taj_Mahal_%28Edited%29.jpeg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/330px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/330px-Colosseo_2020.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Front_view_of_Statue_of_Liberty_%28cropped%29.jpg/330px-Front_view_of_Statue_of_Liberty_%28cropped%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster%2C_London.jpg/330px-Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster%2C_London.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/330px-Sydney_Australia._%2821339175489%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Machu_Picchu%2C_2023_%28012%29.jpg/330px-Machu_Picchu%2C_2023_%28012%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Golden_Gate_Bridge_as_seen_from_Battery_East.jpg/330px-Golden_Gate_Bridge_as_seen_from_Battery_East.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Oia_Santorini_sunset.jpg/330px-Oia_Santorini_sunset.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Al_Deir_Petra.JPG/330px-Al_Deir_Petra.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_-_Cristo_Redentor.jpg/330px-Christ_the_Redeemer_-_Cristo_Redentor.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg/330px-Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg/330px-View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/View_of_the_Grand_Canal_from_Rialto_to_Ca%27Foscari.jpg/330px-View_of_the_Grand_Canal_from_Rialto_to_Ca%27Foscari.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabass.jpg/330px-New_york_times_square-terabass.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Dawn_on_the_S_rim_of_the_Grand_Canyon_%288645178272%29.jpg/330px-Dawn_on_the_S_rim_of_the_Grand_Canyon_%288645178272%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat.jpg/330px-Angkor_Wat.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Schloss_Neuschwanstein_2013.jpg/330px-Schloss_Neuschwanstein_2013.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg/330px-Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg",
];

// Evenly sample TOTAL_IMAGES landmarks from the full list so the ring stays varied.
const RING_IMAGES = Array.from(
  { length: TOTAL_IMAGES },
  (_, i) => IMAGES[Math.round((i * (IMAGES.length - 1)) / (TOTAL_IMAGES - 1))]
);

const lerp = (start, end, t) => start * (1 - t) + end * t;

function FlipCard({ src, index, target, card }) {
  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
      style={{
        position: "absolute",
        width: card.w,
        height: card.h,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front — glass frame around the photo */}
        <div
          className="absolute inset-0 h-full w-full rounded-2xl p-1.5 border-2 border-white/85 shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <img src={src} alt={`landmark-${index}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-transparent" />
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl shadow-xl flex flex-col items-center justify-center p-4 border-2 border-white/85"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div className="text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--ac)" }}>
              View
            </p>
            <p className="text-xs font-medium text-white">Trip</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ScrollMorphHero() {
  const [introPhase, setIntroPhase] = useState("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // --- Container size ---
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);

    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  // --- Virtual scroll (releases to the page once the animation is done) ---
  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);
  const lastScrollAtRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const advance = (delta) => {
      const next = Math.min(Math.max(scrollRef.current + delta, 0), MAX_SCROLL);
      scrollRef.current = next;
      lastScrollAtRef.current = performance.now();
      virtualScroll.set(next);
    };

    // Only capture the wheel while the morph still has somewhere to go, so normal page
    // scrolling works once the animation has played out (and when scrolling back up at the top).
    const shouldCapture = (delta) =>
      !((scrollRef.current >= MAX_SCROLL && delta > 0) || (scrollRef.current <= 0 && delta < 0));

    const handleWheel = (e) => {
      if (!shouldCapture(e.deltaY)) return;
      e.preventDefault();
      advance(e.deltaY);
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;
      if (!shouldCapture(deltaY)) return;
      e.preventDefault();
      advance(deltaY);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [virtualScroll]);

  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });

  const scrollRotate = useTransform(virtualScroll, [600, MAX_SCROLL], [0, 360]);
  const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  // --- Idle spin: the whole ring turns slowly whenever the user isn't scrolling.
  // Driven through a motion value so it never triggers a React re-render.
  const idleSpin = useMotionValue(0);

  useAnimationFrame((time, delta) => {
    // Hold still while the ring is morphing into the arc, or right after a scroll.
    if (smoothMorph.get() > 0.01) return;
    if (time - lastScrollAtRef.current < SPIN_RESUME_DELAY) return;
    idleSpin.set(idleSpin.get() + (delta / 1000) * SPIN_DEG_PER_SEC);
  });

  // Unwind the spin as the ring morphs, so the arc is never left tilted.
  const ringRotation = useTransform([idleSpin, smoothMorph], ([spin, morph]) =>
    spin * Math.max(0, 1 - morph * 2)
  );

  // --- Mouse parallax ---
  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const normalizedX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseX.set(normalizedX * 100);
    };
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  // --- Intro sequence ---
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase("line"), 500);
    const t2 = setTimeout(() => setIntroPhase("circle"), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const scatterPositions = useMemo(
    () =>
      RING_IMAGES.map(() => ({
        x: (Math.random() - 0.5) * 1500,
        y: (Math.random() - 0.5) * 1000,
        rotation: (Math.random() - 0.5) * 180,
        scale: 0.6,
        opacity: 0,
      })),
    []
  );

  const [morphValue, setMorphValue] = useState(0);
  const [rotateValue, setRotateValue] = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);

  useEffect(() => {
    const a = smoothMorph.on("change", setMorphValue);
    const b = smoothScrollRotate.on("change", setRotateValue);
    const c = smoothMouseX.on("change", setParallaxValue);
    return () => {
      a();
      b();
      c();
    };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  // Ring radius and card size are solved together from the real container, so the whole
  // circle always fits on screen and the cards always have gaps between them.
  const { radius: circleRadius, card } = solveRingGeometry(containerSize.width, containerSize.height);
  // Text is capped to the ring's clear interior so cards never cross it.
  const textMaxWidth = Math.max(180, (circleRadius - card.w / 2) * 2 - 28);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center" style={{ perspective: "1000px" }}>
        {/* Intro text — centred inside the ring */}
        <div
          className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: textMaxWidth }}
        >
          <motion.h1
            style={{ opacity: Math.max(0, 1 - morphValue * 2) }}
            className="text-[24px] md:text-[34px] leading-tight font-extrabold tracking-wide text-white"
          >
            PLAN LESS<br />EXPLORE MORE
          </motion.h1>
          <motion.p
            style={{ opacity: Math.max(0, 0.6 - morphValue) }}
            className="mt-3 text-[10px] md:text-xs font-bold tracking-[0.2em] text-white/50"
          >
            SCROLL TO EXPLORE
          </motion.p>
        </div>

        {/* Arc content — fades in once the ring has morphed into the arch */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="absolute top-[12%] z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4"
        >
          <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
            Plan trips that write themselves
          </h2>
          <p className="text-sm md:text-base text-white/70 max-w-lg leading-relaxed">
            Pick your stops, drop in activities, and watch the budget update as the itinerary takes shape.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="relative flex items-center justify-center w-full h-full"
          style={{ rotate: ringRotation }}
        >
          {RING_IMAGES.map((src, i) => {
            let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const lineSpacing = card.w + 14;
              const lineX = i * lineSpacing - (TOTAL_IMAGES * lineSpacing) / 2;
              target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              // A. Circle position
              const circleAngle = (i / TOTAL_IMAGES) * 360;
              const circleRad = (circleAngle * Math.PI) / 180;
              const circlePos = {
                x: Math.cos(circleRad) * circleRadius,
                y: Math.sin(circleRad) * circleRadius,
                rotation: circleAngle + 90,
              };

              // B. Bottom arc position
              const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcRadius = baseRadius * 1.35;
              const arcCenterY = containerSize.height * 0.2 + arcRadius;

              const spreadAngle = 105;
              const startAngle = -90 - spreadAngle / 2;
              const step = spreadAngle / (TOTAL_IMAGES - 1);

              const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
              const boundedRotation = -scrollProgress * (spreadAngle * 0.8);

              const currentArcAngle = startAngle + i * step + boundedRotation;
              const arcRad = (currentArcAngle * Math.PI) / 180;

              const arcPos = {
                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                rotation: currentArcAngle + 90,
                scale: 1.5,
              };

              // C. Morph between the two
              target = {
                x: lerp(circlePos.x, arcPos.x, morphValue),
                y: lerp(circlePos.y, arcPos.y, morphValue),
                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                scale: lerp(1, arcPos.scale, morphValue),
                opacity: 1,
              };
            }

            return <FlipCard key={i} src={src} index={i} target={target} card={card} />;
          })}
        </motion.div>
      </div>
    </div>
  );
}
