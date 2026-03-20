import CursorReticle from '@/components/CursorReticle';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import DataStrip from '@/components/DataStrip';
import ProblemSection from '@/components/ProblemSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import DashboardSection from '@/components/DashboardSection';
import NumbersSection from '@/components/NumbersSection';
import CredibilitySection from '@/components/CredibilitySection';
import FinalCTASection from '@/components/FinalCTASection';
import Footer from '@/components/Footer';
import LiveFeed from '@/components/LiveFeed';

export default function Index() {
  return (
    <>
      <CursorReticle />
      <Navbar />
      <HeroSection />
      <DataStrip />
      <ProblemSection />
      <DataStrip />
      <HowItWorksSection />
      <DataStrip />
      <DashboardSection />
      <DataStrip />
      <NumbersSection />
      <DataStrip />
      <CredibilitySection />
      <DataStrip />
      <FinalCTASection />
      <Footer />
      <LiveFeed />
    </>
  );
}
