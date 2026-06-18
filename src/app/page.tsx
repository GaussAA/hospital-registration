import Header from "@/shared/ui/Header";
import Footer from "@/shared/ui/Footer";
import { HeroSection, StatsSection, ServiceCards, FeaturedHospitals, HowItWorks, TrustSection } from "@/features/home";

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
