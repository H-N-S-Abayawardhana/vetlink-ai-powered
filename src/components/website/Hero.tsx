"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  ArrowDown,
  Brain,
  Sparkles,
  Stethoscope,
  Tablets,
  Zap,
} from "lucide-react";

export default function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-24 md:pt-32 bg-gradient-to-b from-gray-50 via-white to-gray-50/50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient orbs */}
        <motion.div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400/20 via-indigo-300/10 to-transparent blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-teal-400/20 via-teal-300/10 to-transparent blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-30" />
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto"
        >
          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-50 via-indigo-50/80 to-teal-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200/50 shadow-sm shadow-indigo-500/10">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="h-4 w-4 text-indigo-600" />
              </motion.div>
              <span>AI-Powered Healthcare Intelligence</span>
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-teal-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            <span className="block text-gray-900">Smart Pet</span>
            <span className="block bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 bg-clip-text text-transparent">
              Health Care
            </span>
            <span className="block text-gray-900 mt-2">Powered by AI</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Advanced AI diagnostics, personalized care plans, and intelligent
            monitoring—bringing veterinary expertise to your fingertips with
            precision and compassion.
          </motion.p>

          {/* Key Benefits Grid */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.6 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12"
          >
            {[
              {
                icon: Stethoscope,
                title: "AI Diagnostics",
                description: "Advanced skin & anomaly detection",
                color: "indigo",
              },
              {
                icon: Activity,
                title: "Personalized Care",
                description: "Custom diet & health plans",
                color: "teal",
              },
              {
                icon: Tablets,
                title: "Smart Pharmacy",
                description: "Intelligent medication matching",
                color: "indigo",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-8 transition-all hover:border-indigo-200/60 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  layoutId={`feature-bg-${index}`}
                />
                <div className="relative">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 ring-1 ${
                      feature.color === "indigo"
                        ? "bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-indigo-200/30"
                        : "bg-gradient-to-br from-teal-50 to-teal-100/50 ring-teal-200/30"
                    }`}
                  >
                    <feature.icon
                      className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        feature.color === "indigo"
                          ? "text-indigo-600"
                          : "text-teal-600"
                      }`}
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.a
              href="/signup"
              className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-base sm:text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-indigo-800"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="h-5 w-5" />
              Start Free Trial
              <motion.div
                className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 blur-xl"
                transition={{ duration: 0.3 }}
              />
            </motion.a>
            <motion.a
              href="#intelligence"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 text-base sm:text-lg font-semibold ring-1 ring-gray-200/60 transition-all hover:bg-white hover:ring-indigo-200/60 hover:shadow-md"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="h-5 w-5 text-indigo-600" />
              See AI in Action
            </motion.a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="pt-8 border-t border-gray-200/60"
          >
            <p className="text-sm text-gray-500 mb-6">
              Trusted by pet owners and professionals worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-gray-700">
              {[
                "10,000+ Pet Owners",
                "500+ Veterinary Clinics",
                "200+ Pet Pharmacies",
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span className="font-semibold text-sm sm:text-base">
                    {stat}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs font-medium">Scroll to explore</span>
          <ArrowDown className="w-5 h-5" />
        </div>
      </motion.div>
    </section>
  );
}
