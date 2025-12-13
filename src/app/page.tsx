import Navigation from "../components/website/Navigation";
import Hero from "../components/website/Hero";
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
    <div className="min-h-screen bg-[#0B1020] text-slate-50">
      <Navigation />
      <Hero />
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
