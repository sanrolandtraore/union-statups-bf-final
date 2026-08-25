import { lazy, Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import DiscoveryHome from "@/components/landing/DiscoveryHome";
import Footer from "@/components/landing/Footer";

// En dessous de la ligne de flottaison : chargées après le premier rendu
// pour ne pas alourdir le bundle initial (First Contentful Paint).
const AboutSection = lazy(() => import("@/components/landing/AboutSection"));
const VerificationSection = lazy(() => import("@/components/landing/VerificationSection"));
const TrustSection = lazy(() => import("@/components/landing/TrustSection"));
const PartnersMarquee = lazy(() => import("@/components/landing/PartnersMarquee"));
const GallerySection = lazy(() => import("@/components/landing/GallerySection"));
const StartupSchoolSection = lazy(() => import("@/components/landing/StartupSchoolSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const AIAssistant = lazy(() => import("@/components/landing/AIAssistant"));

const SectionFallback = () => <div className="h-40" aria-hidden="true" />;

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <DiscoveryHome />
      <Suspense fallback={<SectionFallback />}><AboutSection /></Suspense>
      <Suspense fallback={<SectionFallback />}><VerificationSection /></Suspense>
      <Suspense fallback={<SectionFallback />}><TrustSection /></Suspense>
      <Suspense fallback={<SectionFallback />}><PartnersMarquee /></Suspense>
      <Suspense fallback={<SectionFallback />}><GallerySection /></Suspense>
      <Suspense fallback={<SectionFallback />}><StartupSchoolSection /></Suspense>
      <Suspense fallback={<SectionFallback />}><TestimonialsSection /></Suspense>
      <Suspense fallback={<SectionFallback />}><FAQSection /></Suspense>
    </main>
    <Footer />
    <Suspense fallback={null}><AIAssistant /></Suspense>
  </div>
);

export default Index;
