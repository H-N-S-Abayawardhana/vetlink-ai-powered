"use client";

import { motion } from "framer-motion";
import { CheckCircle, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/types/plans";

export default function Pricing() {
  const router = useRouter();

  const handlePlanClick = (planId: string) => {
    router.push(`/plans/${planId}`);
  };

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50/50 to-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/30 to-transparent blur-3xl"
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
            Choose Your{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              Plan
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Flexible pricing options for pet owners, pharmacies, and veterinary
            clinics
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan, index) => (
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
              className={`group relative rounded-3xl border ${
                plan.popular
                  ? "border-indigo-300/60 bg-white shadow-xl shadow-indigo-500/10"
                  : "border-gray-200/60 bg-white/80 backdrop-blur-sm"
              } overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/5`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Star className="h-3 w-3 fill-white" />
                    Most Popular
                  </motion.div>
                </div>
              )}

              {/* Hover gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  plan.color === "indigo"
                    ? "from-indigo-50/30"
                    : "from-teal-50/30"
                }`}
                layoutId={`pricing-bg-${index}`}
              />

              <div className="relative p-8">
                {/* Header */}
                <div className="text-center mb-8 pt-4">
                  <div
                    className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${
                      plan.color === "indigo"
                        ? "bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-indigo-200/30"
                        : "bg-gradient-to-br from-teal-50 to-teal-100/50 ring-teal-200/30"
                    }`}
                  >
                    <Sparkles
                      className={`h-7 w-7 ${
                        plan.color === "indigo"
                          ? "text-indigo-600"
                          : "text-teal-600"
                      }`}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500">{plan.subtitle}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8 pb-8 border-b border-gray-200/60">
                  {plan.premiumPrice ? (
                    <>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {plan.price}
                      </div>
                      <div className="text-gray-500 mb-3">
                        {plan.priceSubtext}
                      </div>
                      <div
                        className={`text-3xl font-bold mb-1 ${
                          plan.color === "indigo"
                            ? "text-indigo-600"
                            : "text-teal-600"
                        }`}
                      >
                        {plan.premiumPrice}
                      </div>
                      <div className="text-gray-500">{plan.premiumSubtext}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {plan.price}
                      </div>
                      <div className="text-gray-500">{plan.priceSubtext}</div>
                    </>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + featureIndex * 0.05 }}
                    >
                      <CheckCircle
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                          plan.color === "indigo"
                            ? "text-indigo-600"
                            : "text-teal-600"
                        }`}
                      />
                      <span className="text-gray-600 text-sm leading-relaxed">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Extra info */}
                <div
                  className={`rounded-xl border p-4 mb-6 ${
                    plan.color === "indigo"
                      ? "border-indigo-200/50 bg-indigo-50/30"
                      : "border-teal-200/50 bg-teal-50/30"
                  }`}
                >
                  <p className="text-sm text-gray-900 font-semibold mb-1">
                    {plan.extra.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {plan.extra.description}
                  </p>
                </div>

                {/* CTA Button */}
                <motion.button
                  onClick={() => handlePlanClick(plan.id)}
                  className={`w-full rounded-xl py-3.5 font-semibold transition-all duration-200 ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                      : "bg-white text-gray-700 ring-1 ring-gray-200/60 hover:bg-gray-50 hover:ring-indigo-200/60"
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.cta}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="text-gray-600 mb-4">
            Plans are designed for pet owners, pharmacies, and clinics
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>✓ PayHere payments</span>
            <span>✓ Role-based access (B2C + B2B)</span>
            <span>✓ Cloud-native storage (PostgreSQL + S3)</span>
            <span>✓ Mobile-first UX</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
