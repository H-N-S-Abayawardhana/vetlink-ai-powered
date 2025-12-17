"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, Sparkles, UserPlus, X } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      }
      // Hide header when scrolling down (but not at the very top)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as Element;
        if (!target.closest("nav")) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" passHref>
                <Image
                  src="/vetlink_logo.png"
                  alt="VetLink Logo"
                  width={160}
                  height={56}
                  className="h-10 sm:h-11 lg:h-12 w-auto cursor-pointer opacity-95 hover:opacity-100 transition-opacity"
                  priority
                />
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block flex-1">
            <div className="flex items-center justify-center space-x-6">
              <a
                href="#features"
                className="group relative text-gray-600 hover:text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Features
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-blue-700/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a
                href="#about"
                className="group relative text-gray-600 hover:text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                About
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-blue-700/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a
                href="#pricing"
                className="group relative text-gray-600 hover:text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Pricing
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-blue-600/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a
                href="#testimonials"
                className="group relative text-gray-600 hover:text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Testimonials
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-blue-600/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a
                href="#contact"
                className="group relative text-gray-600 hover:text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Contact
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-blue-700/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Sign In & Sign Up Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="/signin"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-blue-700/30 hover:shadow-sm"
            >
              <LogIn className="h-4 w-4 text-blue-700" />
              Sign In
            </a>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-800 hover:shadow-md hover:shadow-blue-700/20"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700/60 transition-colors touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="px-2 pt-3 pb-5 space-y-2 sm:px-3 bg-white/98 backdrop-blur-xl border-t border-gray-200 shadow-lg">
              <a
                href="#features"
                className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <a
                  href="/signin"
                  className="bg-white text-gray-700 block px-4 py-4 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors text-center touch-manipulation ring-1 ring-gray-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <LogIn className="h-4.5 w-4.5 text-blue-700" />
                    Sign In
                  </span>
                </a>
                <a
                  href="/signup"
                  className="bg-blue-700 text-white block px-4 py-4 rounded-xl text-base font-semibold transition-all text-center touch-manipulation hover:bg-blue-800 shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Sparkles className="h-4.5 w-4.5" />
                    Sign Up
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
