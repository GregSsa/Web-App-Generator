"use client";
import { useEffect, useState } from "react";
export function ServiceWorkerRegistration() {
  const [offline, setOffline] = useState(false);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js"); const update = () => setOffline(!navigator.onLine); update(); addEventListener("online", update); addEventListener("offline", update); return () => { removeEventListener("online", update); removeEventListener("offline", update); }; }, []);
  return offline ? <div role="status" className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-3 py-2 text-center text-sm font-medium text-black">Mode hors connexion — les vérifications sont temporairement indisponibles.</div> : null;
}
