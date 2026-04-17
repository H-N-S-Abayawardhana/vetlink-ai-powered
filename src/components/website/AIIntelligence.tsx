"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Cpu,
  Database,
  LineChart,
  Network,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

export default function AIIntelligence() {
  const intelligenceFeatures = [
    {
      icon: Brain,
      title: "DINOv2 + Vision Transformer (ViT)",
      description:
        "Dog skin disease detection + severity classification (mild/severe) with an LLM-powered guidance layer for human-friendly explanations.",
      metric: "Image",
      metricLabel: "Input",
      color: "indigo",
    },
    {
      icon: Network,
      title: "Video Mobility Analysis",
      description:
        "Pose + gait analysis for limping detection (Normal/Limping) with confidence, symmetry indices, stride length, and leg status interpretation.",
      metric: "30–60s",
      metricLabel: "Video",
      color: "teal",
    },
    {
      icon: LineChart,
      title: "XGBoost Demand Forecasting",
      description:
        "Forecast pharmacy sales demand and generate restock recommendations with priority alerts (CRITICAL → LOW).",
      metric: "32",
      metricLabel: "Engineered Features",
      color: "indigo",
    },
    {
      icon: Database,
      title: "Cloud-Native Records & Storage",
      description:
        "Detection history and profiles stored in Neon PostgreSQL, with uploaded images/videos stored securely in AWS S3 for long-term tracking.",
      metric: "Neon + S3",
      metricLabel: "Persistence",
      color: "teal",
    },
    {
      icon: Cpu,
      title: "Model Hosting & Inference APIs",
      description:
        "Deployed inference services on Hugging Face Spaces to keep AI modules modular, scalable, and easy to integrate.",
      metric: "HF",
      metricLabel: "Spaces",
      color: "indigo",
    },
    {
      icon: Shield,
      title: "Payments & Integrations",
      description:
        "PayHere gateway for subscriptions, appointment payments, and inventory purchases—built for B2C + B2B flows.",
      metric: "PayHere",
      metricLabel: "Gateway",
      color: "teal",
    },
  ];

  return (
    <section
      id="intelligence"
      className="relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50/50 to-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400/10 via-indigo-300/5 to-transparent blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-teal-400/10 via-teal-300/5 to-transparent blur-3xl"
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
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-50 to-teal-50 px-4 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200/50 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span>AI Technology</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Architecture That{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              Ships
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            VetLink is built as a modular, service-oriented platform: a Next.js
            web app + AI/ML inference services + an LLM guidance layer + cloud
            storage—so users get real outputs, not black-box predictions.
          </p>
        </motion.div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16">
          {intelligenceFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-8 sm:p-10 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-teal-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                layoutId={`intelligence-bg-${index}`}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ring-1 ${
                      feature.color === "indigo"
                        ? "bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-indigo-200/30"
                        : "bg-gradient-to-br from-teal-50 to-teal-100/50 ring-teal-200/30"
                    }`}
                  >
                    <feature.icon
                      className={`w-7 h-7 ${
                        feature.color === "indigo"
                          ? "text-indigo-600"
                          : "text-teal-600"
                      }`}
                    />
                  </div>
                  <motion.div
                    className="text-right"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                      {feature.metric}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                      {feature.metricLabel}
                    </div>
                  </motion.div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Process Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-8 sm:p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  End-to-End Workflow
                </h3>
                <p className="text-gray-600 mt-1">
                  From upload → inference → guidance → saved history
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: "01",
                  title: "Capture / Upload",
                  description:
                    "Upload an image or video, or use the camera—works great on mobile.",
                },
                {
                  step: "02",
                  title: "AI Inference",
                  description:
                    "Inference runs via deployed ML services (Hugging Face Spaces) for fast, modular scaling.",
                },
                {
                  step: "03",
                  title: "Guidance + History",
                  description:
                    "LLM-powered explanations + basic care tips, with results saved to Neon DB and assets stored in S3.",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center ring-1 ring-indigo-200/50">
                        <span className="text-lg font-bold text-indigo-700">
                          {step.step}
                        </span>
                      </div>
                      {index < 2 && (
                        <motion.div
                          className="hidden sm:block absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-indigo-200 to-transparent"
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.4 + index * 0.1,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
