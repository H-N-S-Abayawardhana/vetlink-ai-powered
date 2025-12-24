"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      // Show button when user scrolls down more than 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    // Only run on client side
    if (typeof window === "undefined") return;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-50 rounded-2xl bg-blue-700 text-white p-3 shadow-md hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-700/20 transition-all duration-300 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
}
