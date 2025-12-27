"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { LogIn, Menu, Sparkles, UserPlus, X, Brain } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 50], [0.95, 0.98]);
  const navBlur = useTransform(scrollY, [0, 50], [8, 12]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const navItems = [
    { href: "#features", label: "Features" },
    { href: "#intelligence", label: "AI Intelligence" },
    { href: "#about", label: "About" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <motion.nav
      className="fixed w-full top-0 z-50"
      style={{
        opacity: navOpacity,
        backdropFilter: `blur(${navBlur}px)`,
      }}
    >
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isScrolled
            ? "bg-white/95 border-b border-gray-200/60"
            : "bg-white/80 border-b border-gray-100/50"
        }`}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500/20 to-teal-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <Image
                  src="/vetlink_logo.png"
                  alt="VetLink Logo"
                  width={160}
                  height={56}
                  className="relative h-10 sm:h-11 lg:h-12 w-auto opacity-95 group-hover:opacity-100 transition-opacity duration-300"
                  priority
                />
              </div>
              <motion.div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-100/50"
                whileHover={{ scale: 1.05 }}
              >
                <Brain className="h-3 w-3 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700">
                  AI-Powered
                </span>
              </motion.div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="flex items-center space-x-1">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className="group relative px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-200 cursor-pointer"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ y: -1 }}
                >
                  {item.label}
                  <motion.span
                    className="absolute left-4 right-4 -bottom-0.5 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <motion.a
              href="/signin"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200/60 transition-all hover:bg-gray-50/80 hover:ring-indigo-200/60 hover:shadow-sm cursor-pointer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogIn className="h-4 w-4 text-indigo-600" />
              Sign In
            </motion.a>
            <motion.a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl hover:shadow-indigo-500/30 cursor-pointer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </motion.a>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 text-gray-700 hover:text-indigo-700 hover:bg-gray-100/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors cursor-pointer"
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="lg:hidden overflow-hidden"
        >
          <div className="px-2 pt-4 pb-6 space-y-1 bg-white/98 backdrop-blur-xl border-t border-gray-200/60">
            {navItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                className="block px-4 py-3.5 rounded-xl text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.label}
              </motion.a>
            ))}
            <div className="pt-4 mt-4 border-t border-gray-200/60 space-y-2">
              <motion.a
                href="/signin"
                className="flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors ring-1 ring-gray-200/60 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="h-4.5 w-4.5 text-indigo-600" />
                Sign In
              </motion.a>
              <motion.a
                href="/signup"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="h-4.5 w-4.5" />
                Sign Up
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
