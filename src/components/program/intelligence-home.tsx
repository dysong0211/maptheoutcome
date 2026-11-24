"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const DesktopHome = dynamic(() => import("./desktop-intelligence-home").then(m => m.DesktopIntelligenceHome), {loading: () => <p role="status">Opening your program…</p>});
const MobileHome = dynamic(() => import("./mobile-program-home").then(m => m.MobileProgramHome), {loading: () => <p role="status">Opening your program…</p>});
/** Small screens do not mount desktop charts, queues or timeline. */
export function IntelligenceHome() {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile === null ? <p role="status">Opening your program…</p> : mobile ? <MobileHome /> : <DesktopHome />;
}
