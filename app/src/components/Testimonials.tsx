import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, useMotionPreference } from "@/components/EditorialEffects";
import { loadSupabase } from "@/lib/asset";

type Comment = { id: number; name: string; message: string; created_at: string };
const fmtDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Atlantic/Canary" });

/** Opiniones de la gente (tabla comments): una cita grande que va cambiando sola. */
export function Testimonials({ label }: { label: string }) {
  const reduced = useMotionPreference();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Se para para siempre si la persona la pausa o navega ella misma
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    let active = true;
    loadSupabase()
      .then(({ publicClient }) => publicClient.from("comments").select("id, name, message, created_at").order("created_at", { ascending: false }).limit(12))
      .then(({ data, error }) => { if (active) setComments(!error && data ? data : []); })
      .catch(() => { if (active) setComments([]); });
    return () => { active = false; };
  }, []);

  const count = comments?.length ?? 0;
  const playing = !reduced && !stopped && !hovered && !focused && count > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [playing, count]);

  if (comments !== null && count === 0) return null;
  const current = comments?.[index];
  const go = (step: number) => { setStopped(true); setIndex(i => (i + step + count) % count); };

  return <section id="opiniones" className="testimonials-section section-pad" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}><div className="section-wrap">
    <Reveal><div className="section-heading"><span className="eyebrow">{label}</span><span className="section-rule" /></div></Reveal>
    <div className="testimonials-grid">
      <Reveal><div className="testimonials-intro">
        <h2>Lo que <em>dicen.</em></h2>
        <p>{count ? `${count} ${count === 1 ? "persona ha" : "personas han"} dejado su nota.` : "Cargando opiniones…"}</p>
        <Button variant="outlineLuxury" size="lg" asChild><Link to="/panel#visitantes" data-cursor="Escribir">Dejar un comentario <ArrowUpRight /></Link></Button>
      </div></Reveal>

      <Reveal delay={.08}><figure className="testimonial">
        <span className="testimonial-mark" aria-hidden="true">“</span>
        {/* Mientras cambian solas no se anuncian, para no interrumpir al lector de pantalla */}
        <div className="testimonial-body" aria-live={playing ? "off" : "polite"}>
          <AnimatePresence mode="wait">
            {current && <motion.div key={current.id} initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? {} : { opacity: 0, y: -10 }} transition={{ duration: .6, ease: [.22, 1, .36, 1] }}>
              <blockquote>{current.message}</blockquote>
              <figcaption><strong>{current.name}</strong><span>{fmtDate.format(new Date(current.created_at))}</span></figcaption>
            </motion.div>}
          </AnimatePresence>
        </div>
        {count > 1 && <div className="testimonial-nav">
          <button type="button" className="icon-button" aria-label="Opinión anterior" onClick={() => go(-1)}><ArrowLeft /></button>
          <div className="testimonial-dots">{comments!.map((c, i) => <button key={c.id} type="button" aria-label={`Opinión de ${c.name}`} aria-current={i === index} onClick={() => { setStopped(true); setIndex(i); }}>{i === index && <motion.i layoutId="testimonial-dot" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}</button>)}</div>
          <button type="button" className="icon-button" aria-label="Opinión siguiente" onClick={() => go(1)}><ArrowRight /></button>
          {!reduced && <button type="button" className="icon-button testimonial-pause" aria-label={stopped ? "Pasar las opiniones solas" : "Pausar las opiniones"} onClick={() => setStopped(value => !value)}>{stopped ? <Play /> : <Pause />}</button>}
        </div>}
      </figure></Reveal>
    </div>
  </div></section>;
}
