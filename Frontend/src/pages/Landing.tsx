import { useEffect, useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getAppLenis } from "@/lib/appLenis";
import CursorReticle from "@/components/CursorReticle";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DataStrip from "@/components/DataStrip";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DashboardSection from "@/components/DashboardSection";
import FeaturesSection from "@/components/FeaturesSection";
import NumbersSection from "@/components/NumbersSection";
import CredibilitySection from "@/components/CredibilitySection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";
import LiveFeed from "@/components/LiveFeed";

export default function Index() {
  const pageRootRef = useRef<HTMLDivElement>(null);

  // After paint: Lenis is already up (App). Same rAF pattern as HackOrbit after preloader ends.
  // useLayoutEffect here runs before App’s Lenis init on first paint, so useEffect + rAF only.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      getAppLenis()?.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  /**
   * GSAP pin/revert mutates the DOM. If that runs while React is unmounting the
   * landing tree, React throws removeChild NotFoundError. Cleanup in layout phase
   * and use kill(false) so we unregister triggers without pin-revert fighting React.
   * Only kill triggers scoped to this page — not document.body / global triggers.
   */
  useLayoutEffect(() => {
    return () => {
      const root = pageRootRef.current;
      if (!root) return;
      ScrollTrigger.getAll().forEach((st) => {
        const tr = st.trigger;
        if (tr instanceof Element && root.contains(tr)) {
          st.kill(false);
        }
      });
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <div ref={pageRootRef} className="min-h-0">
      <CursorReticle />
      <Navbar />
      <HeroSection />
      <DataStrip />
      <div id="problem">
        <ProblemSection />
      </div>
      <DataStrip />
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <DataStrip />
      <DashboardSection />
      <DataStrip />
      <div id="features">
        <FeaturesSection />
      </div>
      <DataStrip />
      <div id="impact">
        <NumbersSection />
      </div>
      <DataStrip />
      <CredibilitySection />
      <DataStrip />
      <FinalCTASection />
      <Footer />
      <LiveFeed />
    </div>
  );
}
