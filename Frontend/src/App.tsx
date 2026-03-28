import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import Lenis from "lenis";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisProvider } from "@/context/analysis-context";
import { SessionProvider } from "@/context/session-context";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import AnalyzeUpload from "./pages/AnalyzeUpload";
import AnalyzeProcessing from "./pages/AnalyzeProcessing";
import AnalyzeReport from "./pages/AnalyzeReport";
import AnalyzeError from "./pages/AnalyzeError";
import TaxWizard from "./pages/TaxWizard";
import FirePlanner from "./pages/FirePlanner";
import MentorPage from "./pages/MentorPage";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";

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
      <SessionProvider>
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
                path="/dashboard"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <AnalyzeUpload />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze/processing"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <AnalyzeProcessing />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze/report"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <AnalyzeReport />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/analyze/error"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <AnalyzeError />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/tax"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <TaxWizard />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/fire"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <FirePlanner />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/mentor"
                element={
                  <AuthGuard>
                    <AppLayout>
                      <MentorPage />
                    </AppLayout>
                  </AuthGuard>
                }
              />
              <Route
                path="/demo"
                element={
                  <AppLayout>
                    <Demo />
                  </AppLayout>
                }
              />

              <Route path="/app" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AnalysisProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default App;
