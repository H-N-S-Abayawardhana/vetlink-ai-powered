"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, Brain, Shield, Heart, Database } from "lucide-react";

export default function About() {
  const benefits = [
    {
      icon: Brain,
      title: "Explainable AI Guidance",
      description:
        "Predictions are paired with user-friendly, non-clinical explanations and basic care tips to improve trust and interpretability.",
    },
    {
      icon: Shield,
      title: "Service-Oriented Architecture",
      description:
        "Frontend, inference services, LLM guidance, and storage are separated for scalability and future extension into advanced multimodal use cases.",
    },
    {
      icon: Database,
      title: "History & Tracking",
      description:
        "When a pet is registered, analyses can be stored to build a longitudinal health record (assets in S3, metadata in PostgreSQL).",
    },
    {
      icon: Heart,
      title: "Mobile-First UX",
      description:
        "Designed to be highly mobile-friendly across smartphones, tablets, and desktops—so owners can capture images/videos anywhere.",
    },
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden py-24 sm:py-32 bg-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-teal-100/20 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-50 to-teal-50 px-4 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200/50 mb-6">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Premium, trustworthy care
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                VetLink?
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              VetLink combines computer vision, ML-based risk prediction, and an
              LLM guidance layer to deliver practical, explainable pet-health
              insights—plus cloud-native storage for real-world usability.
            </p>

            <div className="space-y-5">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center ring-1 ring-indigo-200/30 group-hover:ring-indigo-300/50 transition-all">
                    <benefit.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1.5">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-xl shadow-indigo-500/5 p-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-teal-50/20 rounded-3xl" />
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-gray-200/50">
                <Image
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Veterinarian with pet"
                  width={600}
                  height={400}
                  className="h-auto w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" />
              </div>
            </div>
            {/* Decorative elements */}
            <motion.div
              className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-200/30 to-teal-200/30 blur-2xl -z-10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
