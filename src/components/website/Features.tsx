"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, Pill, ScanFace, Salad, ArrowRight } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: ScanFace,
      title: "Skin Disease Detection + Severity",
      description:
        "Upload or capture a skin image—DINOv2 + ViT predicts disease type and mild/severe stage, then generates clear, non-clinical guidance cards.",
      image:
        "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      color: "indigo",
      href: "/dashboard/skin-disease",
    },
    {
      icon: Activity,
      title: "Mobility & Limping Analysis",
      description:
        "Upload a 30–60s walking video—pose & gait analysis outputs limping status, confidence, symmetry indices, stride lengths, and leg status.",
      image:
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      color: "teal",
      href: "/dashboard/Limping",
    },
    {
      icon: Salad,
      title: "Health Assessment (BCS) + Diet Plan",
      description:
        "BCS-based risk prediction across multiple diseases plus a personalized diet plan using age, weight, activity, and preferences.",
      image:
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      color: "indigo",
      href: "/dashboard/pets/bcs",
    },
    {
      icon: Pill,
      title: "Pharmacy Demand Forecasting",
      description:
        "Fetch inventory + sales context—XGBoost forecasts demand, estimates days-to-stockout, recommends reorder quantity, and assigns restock priority.",
      image:
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      color: "teal",
      href: "/dashboard/pharmacy",
    },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden py-24 sm:py-32 bg-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/30 to-transparent blur-3xl"
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
        <motion.div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-teal-100/30 to-transparent blur-3xl"
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
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Comprehensive{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              AI Features
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Four powerful AI-driven systems working together to provide
            comprehensive pet healthcare
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              {/* Hover gradient overlay */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  feature.color === "indigo"
                    ? "from-indigo-50/50"
                    : "from-teal-50/50"
                }`}
                layoutId={`feature-overlay-${index}`}
              />

              <div className="relative p-6 sm:p-8">
                {/* Icon */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-6 ring-1 ${
                    feature.color === "indigo"
                      ? "bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-indigo-200/30"
                      : "bg-gradient-to-br from-teal-50 to-teal-100/50 ring-teal-200/30"
                  }`}
                >
                  <feature.icon
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${
                      feature.color === "indigo"
                        ? "text-indigo-600"
                        : "text-teal-600"
                    }`}
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>

                {/* Image */}
                <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden ring-1 ring-gray-200/50 mb-4">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />
                </div>

                {/* Learn more link */}
                <motion.a
                  href={feature.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
