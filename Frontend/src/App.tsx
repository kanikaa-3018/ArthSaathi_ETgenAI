import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import Lenis from "lenis";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import AnalyzeUpload from "./pages/AnalyzeUpload";
import AnalyzeProcessing from "./pages/AnalyzeProcessing";
import AnalyzeReport from "./pages/AnalyzeReport";
import AnalyzeError from "./pages/AnalyzeError";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";
import { AnalysisProvider } from "@/context/analysis-context";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.destroy();
      gsap.ticker.remove(raf);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AnalysisProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/analyze" element={<AnalyzeUpload />} />
              <Route path="/analyze/processing" element={<AnalyzeProcessing />} />
              <Route path="/analyze/report" element={<AnalyzeReport />} />
              <Route path="/analyze/error" element={<AnalyzeError />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/app" element={<AnalyzeUpload />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AnalysisProvider>
    </QueryClientProvider>
  );
};

export default App;
