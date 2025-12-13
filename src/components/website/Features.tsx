'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, Pill, ScanFace, Salad } from "lucide-react";

export default function Features() {
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section id="features" className="relative overflow-hidden py-16 md:py-20 bg-[#0B1020]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-10rem] h-80 w-[44rem] rounded-full bg-[#00E5FF]/14 blur-3xl" />
        <div className="absolute -bottom-24 left-[-10rem] h-80 w-[44rem] rounded-full bg-[#7C7CFF]/16 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.08),transparent_55%)]" />
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 mb-4 tracking-tight">
            Our Revolutionary Features
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            Four powerful AI-driven systems working together to provide comprehensive pet healthcare
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {/* Feature 1: Skin Care Detection */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6 transition-all"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.20),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#00E5FF]/20" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-white/15">
                <ScanFace className="w-6 h-6 md:w-8 md:h-8 text-[#00E5FF]" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-50 mb-2 md:mb-3">Skin Care Detection</h3>
              <p className="text-sm md:text-base text-gray-300 mb-3 md:mb-4 leading-relaxed">
                Advanced AI analyzes skin conditions and provides stage-based first aid recommendations for immediate care.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet skin care analysis"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020]/45 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Anomaly Detection */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6 transition-all"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.20),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#2DD4BF]/20" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-white/15">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-[#2DD4BF]" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-50 mb-2 md:mb-3">Anomaly Detection</h3>
              <p className="text-sm md:text-base text-gray-300 mb-3 md:mb-4 leading-relaxed">
                Intelligent monitoring system detects unusual behaviors including limping patterns and alerts you to potential health issues.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet behavior monitoring"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020]/45 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 3: AI Diet Plans */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6 transition-all"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.16),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#00E5FF]/18" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-white/15">
                <Salad className="w-6 h-6 md:w-8 md:h-8 text-[#00E5FF]" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-50 mb-2 md:mb-3">AI Diet Plans</h3>
              <p className="text-sm md:text-base text-gray-300 mb-3 md:mb-4 leading-relaxed">
                Personalized nutrition recommendations based on your pet's breed, age, weight, and health conditions.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet nutrition and feeding"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020]/45 to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 4: Intelligent Pharmacy */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6 transition-all"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,124,255,0.20),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#7C7CFF]/22" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 ring-1 ring-white/15">
                <Pill className="w-6 h-6 md:w-8 md:h-8 text-[#7C7CFF]" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-50 mb-2 md:mb-3">Intelligent Pharmacy</h3>
              <p className="text-sm md:text-base text-gray-300 mb-3 md:mb-4 leading-relaxed">
                Smart pharmacy matching system finds the best medications and dosages for your pet's specific needs.
              </p>
              <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden ring-1 ring-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Pet medication and pharmacy"
                  fill
                  className="object-cover opacity-90"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020]/45 to-transparent" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
