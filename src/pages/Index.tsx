import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import RegistrationSection from "@/components/landing/RegistrationSection";
import ProfileSection from "@/components/landing/ProfileSection";
import VerificationSection from "@/components/landing/VerificationSection";
import TrustSection from "@/components/landing/TrustSection";
import VideoSection from "@/components/landing/VideoSection";
import PartnersMarquee from "@/components/landing/PartnersMarquee";
import FeaturesSection from "@/components/landing/FeaturesSection";
import GallerySection from "@/components/landing/GallerySection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import StartupSchoolSection from "@/components/landing/StartupSchoolSection";
import AccompagnementSection from "@/components/landing/AccompagnementSection";
import Footer from "@/components/landing/Footer";
import AIAssistant from "@/components/landing/AIAssistant";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <RegistrationSection />
      <ProfileSection />
      <VerificationSection />
      <TrustSection />
      <VideoSection />
      <PartnersMarquee />
      <FeaturesSection />
      <GallerySection />
      <StartupSchoolSection />
      <TestimonialsSection />
      <FAQSection />
      <AccompagnementSection />
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default Index;
