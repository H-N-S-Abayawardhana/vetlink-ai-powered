"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  Sparkles,
  Stethoscope,
  Tablets,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-24 md:pt-32 bg-gray-50">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Happy dog and cat with veterinarian"
          fill
          className="object-cover opacity-5"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-gray-50" />

        <motion.div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-28 right-[-10rem] h-80 w-[44rem] rounded-full bg-blue-50/50 blur-3xl"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-0">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {/* Logo/Brand */}
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 mb-6">
              <Sparkles className="h-4 w-4 text-blue-700" />
              Premium AI Pet Healthcare
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                VetLink
              </span>
            </h1>
            <p className="text-lg sm:text-2xl md:text-3xl text-gray-700 font-light mb-6 sm:mb-8 px-2">
              Smart Pet Healthcare Management System
            </p>
          </div>

          {/* Main tagline */}
          <p className="text-base sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Revolutionize your pet&apos;s health with AI-powered diagnostics,
            personalized care plans, and intelligent monitoring. Bringing
            veterinary expertise to your fingertips.
          </p>

          {/* Key benefits */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 px-4"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6 transition-all hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              </div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-1 ring-blue-100">
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </div>
              <h3 className="relative text-base sm:text-lg font-semibold text-gray-900 mb-2">
                AI-Powered Detection
              </h3>
              <p className="relative text-gray-600 text-xs sm:text-sm">
                Advanced skin care and anomaly detection
              </p>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6 transition-all hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              </div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-1 ring-blue-100">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="relative text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Personalized Care
              </h3>
              <p className="relative text-gray-600 text-xs sm:text-sm">
                Custom diet plans and health recommendations
              </p>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6 transition-all hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              </div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-1 ring-blue-100">
                <Tablets className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="relative text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Smart Pharmacy
              </h3>
              <p className="relative text-gray-600 text-xs sm:text-sm">
                Intelligent medication matching system
              </p>
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button className="rounded-xl bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:shadow-md hover:shadow-blue-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60">
              Start Free Trial
            </button>
            <button className="rounded-xl bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold ring-1 ring-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:ring-blue-700/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60">
              Watch Demo
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200 px-4">
            <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
              Trusted by pet owners and professionals worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-gray-700">
              <div className="font-semibold text-sm sm:text-base">
                10,000+ Pet Owners
              </div>
              <div className="font-semibold text-sm sm:text-base">
                500+ Veterinary Clinics
              </div>
              <div className="font-semibold text-sm sm:text-base">
                200+ Pet Pharmacies
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
      </motion.div>
    </section>
  );
}
