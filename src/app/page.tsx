import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import ServiceCards from "@/components/home/ServiceCards";
import FeaturedHospitals from "@/components/home/FeaturedHospitals";
import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";

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
