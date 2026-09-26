import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { readStored, writeStored } from "@/lib/utils";

export function useMotionPreference() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function Entrance() {
  const reduced = useMotionPreference();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (reduced || readStored("mi-intro-seen", false, "session")) return;
    setOpen(true);
    // Se marca como vista solo al cerrarse: si el efecto se repite, la cortina no se queda puesta
    const timer = window.setTimeout(() => { setOpen(false); writeStored("mi-intro-seen", true, "session"); }, 650);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return <AnimatePresence>{open && <motion.div className="entrance-screen" initial={{ y: 0 }} animate={{ y: 0 }} exit={{ y: "-102%" }} transition={{ duration: .45, ease: [.64, 0, .24, 1] }} aria-hidden="true">
    <motion.div className="entrance-monogram" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>MI</motion.div>
    <motion.div className="entrance-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: .35, duration: .6, ease: [.22, 1, .36, 1] }} />
  </motion.div>}</AnimatePresence>;
}

export function ScrollAtmosphere() {
  const reduced = useMotionPreference();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 28 });
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const current = window.scrollY;
        setScrolled(current > 24);
        if (Math.abs(current - last) > 8) setVisible(current < 110 || current < last);
        last = current;
        frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    if (reduced || !window.matchMedia("(min-width: 901px) and (pointer: fine)").matches) return;
    // El desplazamiento suave solo se descarga en ordenador, así el móvil carga menos
    let frame = 0;
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let cancelled = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: { offset: -78 } });
      const raf = (time: number) => { lenis?.raf(time); frame = requestAnimationFrame(raf); };
      frame = requestAnimationFrame(raf);
    }).catch(() => { /* sin desplazamiento suave */ });
    return () => { cancelled = true; cancelAnimationFrame(frame); lenis?.destroy(); };
  }, [reduced]);
  useEffect(() => {
    document.documentElement.dataset["scrolled"] = scrolled ? "true" : "false";
    document.documentElement.dataset["headerVisible"] = visible ? "true" : "false";
  }, [scrolled, visible]);
  return <motion.div className="reading-progress" style={{ scaleX }} aria-hidden="true" />;
}

export function CustomCursor() {
  const reduced = useMotionPreference();
  const [mounted, setMounted] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 550, damping: 40 });
  const springY = useSpring(y, { stiffness: 550, damping: 40 });
  const [label, setLabel] = useState("");
  const [inside, setInside] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine) and (min-width: 901px)").matches) return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX); y.set(event.clientY); setInside(true);
      const target = (event.target as Element).closest("a, button");
      setLabel(target?.getAttribute("data-cursor") ?? (target?.matches(".project-row") ? "Ver" : target?.matches("a[href$='#reservar']") ? "Reservar" : target ? "Abrir" : ""));
    };
    const leave = () => setInside(false);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, [reduced, x, y]);
  if (!mounted || reduced) return null;
  return <motion.div className={`editorial-cursor ${label ? "is-active" : ""}`} style={{ x: springX, y: springY, opacity: inside ? 1 : 0 }} aria-hidden="true">{label && <span>{label}</span>}</motion.div>;
}

export function Magnetic({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useMotionPreference();
  const x = useSpring(0, { stiffness: 240, damping: 22 });
  const y = useSpring(0, { stiffness: 240, damping: 22 });
  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced || !window.matchMedia("(pointer: fine) and (min-width: 901px)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * .12);
    y.set((event.clientY - rect.top - rect.height / 2) * .12);
  };
  return <motion.div className={className} style={{ x, y }} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}>{children}</motion.div>;
}

export function EditorialMarquee({ phrase = "Atención al cliente · Organización · Desarrollo web · Discreción · Detalle · " }: { phrase?: string }) {
  const reduced = useMotionPreference();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const [speed, setSpeed] = useState(0);
  useEffect(() => velocity.on("change", value => setSpeed(Math.min(Math.abs(value) / 1300, .6))), [velocity]);
  return <div className="marquee-band" aria-label={phrase}><motion.div className="marquee-track" aria-hidden="true" animate={reduced ? false : { x: ["0%", "-50%"] }} transition={{ duration: 38 / (1 + speed), ease: "linear", repeat: Infinity }}>{Array.from({ length: 4 }, (_, i) => <span key={i}>{phrase}</span>)}</motion.div></div>;
}

export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const reduced = useMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced) { setValue(to); return; }
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) return;
      const start = performance.now();
      const tick = (time: number) => {
        const t = Math.min((time - start) / 1150, 1);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: .5 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [to, reduced]);
  return <span ref={ref}>{value}{suffix}</span>;
}

export function ProfileParallax({ children, direction = 1 }: { children: ReactNode; direction?: number }) {
  const reduced = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [direction * 12, direction * -12]);
  return <div ref={ref}><motion.div style={reduced ? {} : { y }}>{children}</motion.div></div>;
}

/** Titular que se revela letra a letra. Cada línea es un texto; las líneas pares van en cursiva y con sangría. */
export function HeroTitle({ lines = ["Mario", "Iglesias."], id = "hero-title", delay = .25 }: { lines?: string[]; id?: string; delay?: number }) {
  const reduced = useMotionPreference();
  const ref = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, .86]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, .2]);
  return <motion.h1 ref={ref} id={id} aria-label={lines.join(" ")} style={reduced ? {} : { scale, opacity }}>
    {lines.map((line, lineIndex) => <span className="hero-title-line" key={line} aria-hidden="true"><span className={lineIndex ? "hero-line-indent" : ""}>{Array.from(line).map((character, index) => <span className="hero-letter-mask" key={`${lineIndex}-${index}`}><motion.span className={lineIndex ? "hero-italic" : ""} initial={reduced ? false : { y: "110%" }} animate={{ y: "0%" }} transition={{ delay: delay + lineIndex * .16 + index * .035, duration: .75, ease: [.2, .75, .2, 1] }}>{character === " " ? " " : character}</motion.span></span>)}</span></span>)}
  </motion.h1>;
}

export function ProjectPreview({ name, children }: { name: string; children: ReactNode }) {
  const reduced = useMotionPreference();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [hovered, setHovered] = useState(false);
  return <div className="project-preview-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onMouseMove={event => { x.set(event.clientX + 18); y.set(event.clientY - 45); }}>
    {children}
    {!reduced && <AnimatePresence>{hovered && <motion.div className="project-float" style={{ x, y }} initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .94 }} transition={{ duration: .2 }} aria-hidden="true"><span>PROYECTO / MI</span><strong>{name}</strong><span>EXPLORAR ↗</span></motion.div>}</AnimatePresence>}
  </div>;
}

/** Aparición al entrar en pantalla (fundido + desplazamiento corto). */
export function Reveal({ children, className = "", immediate = false, delay = 0 }: { children: ReactNode; className?: string; immediate?: boolean; delay?: number }) {
  const reduced = useMotionPreference();
  return <motion.div className={`reveal-mask ${className}`} initial={reduced || immediate ? false : { opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .05 }} transition={{ duration: .85, delay, ease: [0.2, 0.65, 0.25, 1] }}>{children}</motion.div>;
}
