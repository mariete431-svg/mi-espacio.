import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CustomCursor, ScrollAtmosphere, useMotionPreference } from "@/components/EditorialEffects";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import Home from "@/pages/Home";

// El resto de páginas se descargan solo cuando se visitan
const CvPage = lazy(() => import("@/pages/CvPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const PanelPage = lazy(() => import("@/pages/PanelPage"));
const BuilderPage = lazy(() => import("@/pages/BuilderPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/** Tras cambiar de página: arriba del todo, o a la sección del enlace (#reservar…). */
function scrollToLocation(hash: string) {
  if (!hash) { window.scrollTo(0, 0); return; }
  let tries = 0;
  const go = () => {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) target.scrollIntoView();
    else if (tries++ < 20) window.setTimeout(go, 50);
  };
  go();
}

export default function App() {
  const location = useLocation();
  const reduced = useMotionPreference();

  // Primera carga con #seccion en la dirección
  useEffect(() => { if (location.hash) scrollToLocation(location.hash); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <ToastProvider>
    <ScrollAtmosphere />
    <CustomCursor />
    <SiteHeader />
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => scrollToLocation(window.location.hash)}>
      <motion.div
        key={location.pathname}
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? {} : { opacity: 0, y: -10 }}
        transition={{ duration: .45, ease: [.22, 1, .36, 1] }}
      >
        <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<div style={{ minHeight: "100svh" }} />}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/cv" element={<CvPage />} />
          <Route path="/tareas" element={<TasksPage />} />
          <Route path="/panel" element={<PanelPage />} />
          <Route path="/crear-cv" element={<BuilderPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        <SiteFooter />
      </motion.div>
    </AnimatePresence>
  </ToastProvider>;
}
