import { lazy, Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import DiscoveryHome from "@/components/landing/DiscoveryHome";
import AboutSection from "@/components/landing/AboutSection";
import VerificationSection from "@/components/landing/VerificationSection";
import TrustSection from "@/components/landing/TrustSection";
import PartnersMarquee from "@/components/landing/PartnersMarquee";
import GallerySection from "@/components/landing/GallerySection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import StartupSchoolSection from "@/components/landing/StartupSchoolSection";
import Footer from "@/components/landing/Footer";

const AIAssistant = lazy(() => import("@/components/landing/AIAssistant"));

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <DiscoveryHome />
      <AboutSection />
      <VerificationSection />
      <TrustSection />
      <PartnersMarquee />
      <GallerySection />
      <StartupSchoolSection />
      <TestimonialsSection />
      <FAQSection />
    </main>
    <Footer />
    <Suspense fallback={null}><AIAssistant /></Suspense>
  </div>
);

export default Index;
