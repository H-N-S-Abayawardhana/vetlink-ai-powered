'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden py-20 bg-[#0B1020]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-10rem] h-80 w-[44rem] rounded-full bg-[#7C7CFF]/14 blur-3xl" />
        <div className="absolute -bottom-24 right-[-10rem] h-80 w-[44rem] rounded-full bg-[#00E5FF]/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.08),transparent_55%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 sm:p-8"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-4">
              <Sparkles className="h-4 w-4 text-[#00E5FF]" />
              Premium, trustworthy care
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-6 tracking-tight">
              Why Choose VetLink?
            </h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              VetLink represents the future of pet healthcare, combining cutting-edge artificial intelligence
              with veterinary expertise to provide comprehensive, personalized care for your beloved pets.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">24/7 Health Monitoring</h3>
                  <p className="text-gray-300">Continuous monitoring and instant alerts for any health concerns</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">AI-Powered Diagnostics</h3>
                  <p className="text-gray-300">Advanced machine learning algorithms for accurate health assessments</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">Personalized Care Plans</h3>
                  <p className="text-gray-300">Tailored recommendations based on your pet's unique needs and health history</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#00E5FF]/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#7C7CFF]/12 blur-3xl" />
            </div>

            <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Veterinarian with pet"
                width={600}
                height={400}
                className="h-auto w-full object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020]/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
