"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FileText, Activity, LineChart, ScanFace } from "lucide-react";

export default function PrimaryFeatures() {
  const features = [
    {
      icon: ScanFace,
      title: "Skin Disease Detection Workflow",
      description:
        "Upload or capture a skin image → detect disease type → classify severity (mild/severe) → show explainable guidance cards → optionally save to pet history (S3 + DB).",
      image:
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      color: "indigo",
    },
    {
      icon: Activity,
      title: "Mobility & Limping Analysis Workflow",
      description:
        "Upload a 30–60 second walking video → limping detection + confidence → gait symmetry indices and stride lengths → disease risk prediction from questionnaire inputs → history tracking.",
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      color: "teal",
    },
    {
      icon: LineChart,
      title: "Pharmacy Forecasting Workflow",
      description:
        "Fetch inventory + product data → predict future sales demand → estimate days until stockout → recommend reorder quantity → generate priority-based restocking alerts (CRITICAL → LOW).",
      image:
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      color: "indigo",
    },
    {
      icon: FileText,
      title: "Health Assessment + Diet Plan Workflow",
      description:
        "Register a pet profile → predict Body Condition Score (BCS) and multi-disease risks → generate a diet plan using age/weight/activity/preferences → save results for long-term monitoring.",
      image:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      color: "teal",
    },
  ];

  return (
    <section
      id="primary-features"
      className="relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-gray-50/50 to-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-transparent blur-3xl"
          animate={{
            x: [0, 50, 0],
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            How Each{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              Module Works
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real workflows implemented in the platform—built around explainable
            outputs, history tracking, and actionable recommendations.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-8 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <motion.div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  feature.color === "indigo"
                    ? "from-indigo-50/30"
                    : "from-teal-50/30"
                }`}
                layoutId={`primary-feature-bg-${index}`}
              />

              <div className="relative flex items-start gap-5 sm:gap-6">
                <div
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ring-1 ${
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                  <div className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden ring-1 ring-gray-200/50">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/10 to-transparent" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
