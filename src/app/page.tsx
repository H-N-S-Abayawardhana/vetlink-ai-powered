import Navigation from "../components/website/Navigation";
import Hero from "../components/website/Hero";
import AIIntelligence from "../components/website/AIIntelligence";
import PrimaryFeatures from "../components/website/PrimaryFeatures";
import Features from "../components/website/Features";
import About from "../components/website/About";
import Pricing from "../components/website/Pricing";
import Testimonials from "../components/website/Testimonials";
import Contact from "../components/website/Contact";
import Footer from "../components/website/Footer";
import BackToTop from "../components/website/BackToTop";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <Navigation />
      <Hero />
      <AIIntelligence />
      <PrimaryFeatures />
      <Features />
      <About />
      <Pricing />
      <Testimonials />
      <Contact />
      <Footer />
      <BackToTop />
    </div>
  );
}
