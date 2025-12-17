"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, Pill, ScanFace, Salad } from "lucide-react";

export default function Features() {
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      id="features"
      className="relative overflow-hidden py-16 md:py-20 bg-gray-50"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-10rem] h-80 w-[44rem] rounded-full bg-blue-50/40 blur-3xl" />
        <div className="absolute -bottom-24 left-[-10rem] h-80 w-[44rem] rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          variants={fadeUp}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Our Revolutionary Features
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Four powerful AI-driven systems working together to provide
            comprehensive pet healthcare
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {/* Feature 1: Skin Care Detection */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-1 ring-blue-200/50" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-blue-100">
                <ScanFace className="w-6 h-6 md:w-8 md:h-8 text-blue-700" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                Skin Care Detection
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
                Advanced AI analyzes skin conditions and provides stage-based
                first aid recommendations for immediate care.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet skin care analysis"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Anomaly Detection */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-1 ring-blue-200/50" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-blue-100">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                Anomaly Detection
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
                Intelligent monitoring system detects unusual behaviors
                including limping patterns and alerts you to potential health
                issues.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet behavior monitoring"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 3: AI Diet Plans */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-1 ring-blue-200/50" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-blue-100">
                <Salad className="w-6 h-6 md:w-8 md:h-8 text-blue-700" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                AI Diet Plans
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
                Personalized nutrition recommendations based on your pet&apos;s
                breed, age, weight, and health conditions.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet nutrition and feeding"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 4: Intelligent Pharmacy */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-1 ring-blue-200/50" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-blue-100">
                <Pill className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                Intelligent Pharmacy
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 leading-relaxed">
                Smart pharmacy matching system finds the best medications and
                dosages for your pet&apos;s specific needs.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet medication and pharmacy"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
