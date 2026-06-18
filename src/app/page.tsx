import Header from "@/shared/ui/Header";
import Footer from "@/shared/ui/Footer";
import HeroSection from "@/features/home/components/HeroSection";
import StatsSection from "@/features/home/components/StatsSection";
import ServiceCards from "@/features/home/components/ServiceCards";
import FeaturedHospitals from "@/features/home/components/FeaturedHospitals";
import HowItWorks from "@/features/home/components/HowItWorks";
import TrustSection from "@/features/home/components/TrustSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <ServiceCards />
        <HowItWorks />
        <FeaturedHospitals />
        <TrustSection />
      </main>
      <Footer />
    </>
  );
}
