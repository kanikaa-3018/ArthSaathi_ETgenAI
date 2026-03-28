import React, { useEffect } from "react";
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
import TaxWizard from "./pages/TaxWizard";
import FirePlanner from "./pages/FirePlanner";
import MentorPage from "./pages/MentorPage";
import AuthCallback from "./pages/AuthCallback";
import { AppNavbar } from "@/components/AppNavbar";
import { FloatingChat } from "@/components/FloatingChat";
import { AuthGuard } from "@/components/AuthGuard";
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

function LayoutWithNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      <div className="pt-12">{children}</div>
      <FloatingChat />
    </>
  );
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
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/analyze"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <AnalyzeUpload />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze/processing"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <AnalyzeProcessing />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze/report"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <AnalyzeReport />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze/error"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <AnalyzeError />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/tax"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <TaxWizard />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/fire"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <FirePlanner />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/mentor"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <MentorPage />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/demo"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <Demo />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route
                path="/app"
                element={
                  <AuthGuard>
                    <LayoutWithNav>
                      <AnalyzeUpload />
                    </LayoutWithNav>
                  </AuthGuard>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AnalysisProvider>
    </QueryClientProvider>
  );
};

export default App;
