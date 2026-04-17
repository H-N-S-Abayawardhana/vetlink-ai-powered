"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Dog Owner",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "VetLink's skin detection feature helped me catch my dog's early-stage dermatitis. The AI recommendations were spot-on and saved us a costly vet visit!",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Cat Owner",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "The anomaly detection system alerted me when my cat started limping. Early detection meant faster treatment and a quicker recovery.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Multi-Pet Owner",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "The AI diet plans have been a game-changer for my pets' health. Each of my three pets has a personalized nutrition plan that works perfectly!",
      rating: 5,
    },
    {
      name: "David Thompson",
      role: "Golden Retriever Owner",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "The health monitoring dashboard gives me peace of mind. I can track my dog's activity levels, sleep patterns, and overall wellness trends all in one place.",
      rating: 5,
    },
    {
      name: "Lisa Park",
      role: "Persian Cat Owner",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "VetLink's grooming recommendations are fantastic! My Persian cat's coat has never looked better. The AI suggested the perfect grooming schedule and products.",
      rating: 5,
    },
    {
      name: "James Wilson",
      role: "Senior Pet Owner",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "As my dog ages, VetLink's senior care features have been invaluable. The medication reminders and health alerts help me provide the best care for my 12-year-old companion.",
      rating: 5,
    },
    {
      name: "Maria Garcia",
      role: "Labrador Owner",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "The pharmacy matching system is incredible! It found the exact medication my dog needed at a nearby pharmacy, saving me hours of searching.",
      rating: 5,
    },
    {
      name: "Robert Kim",
      role: "Siamese Cat Owner",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "I love how VetLink learns from my cat's behavior patterns. The predictive alerts have helped me catch issues before they become serious problems.",
      rating: 5,
    },
    {
      name: "Jennifer Lee",
      role: "Multiple Pet Owner",
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "Managing health records for three pets used to be overwhelming. VetLink makes it so easy with its intuitive dashboard and AI-powered insights.",
      rating: 5,
    },
    {
      name: "Michael Brown",
      role: "German Shepherd Owner",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "The tele-vet consultation feature is a lifesaver! I can get professional advice instantly without leaving home, especially helpful for my anxious dog.",
      rating: 5,
    },
    {
      name: "Amanda White",
      role: "Maine Coon Owner",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "VetLink's AI diet recommendations transformed my cat's health. The personalized meal plans based on breed and age are spot-on and easy to follow.",
      rating: 5,
    },
    {
      name: "Christopher Davis",
      role: "Beagle Owner",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
      content:
        "The appointment scheduling is seamless, and the automated reminders ensure I never miss a checkup. The whole system is incredibly user-friendly!",
      rating: 5,
    },
  ];

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = [
    ...testimonials,
    ...testimonials,
    ...testimonials,
  ];

  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  return (
    <section
      id="testimonials"
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            What Pet Owners{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              Say
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Real stories from pet owners who trust VetLink with their pets&apos;
            health
          </p>
        </motion.div>

        {/* Continuous Scrolling Container */}
        <div className="relative overflow-hidden">
          {/* Mask gradients for fade effect */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />

          {/* Scrolling testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Column 1 */}
            <div
              className="relative overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]"
              onMouseEnter={() => setHoveredColumn("col1")}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div
                className={`testimonial-scroll space-y-6 lg:space-y-8 ${
                  hoveredColumn === "col1" ? "paused" : ""
                }`}
              >
                {duplicatedTestimonials.map((testimonial, index) => (
                  <div
                    key={`col1-${index}`}
                    className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-7 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <Quote className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-indigo-100" />

                    <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      <p className="text-gray-700 italic leading-relaxed mb-6 text-sm sm:text-base">
                        &quot;{testimonial.content}&quot;
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 blur-sm opacity-70" />
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={50}
                            height={50}
                            className="relative rounded-full object-cover ring-2 ring-gray-200/60"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2 */}
            <div
              className="relative overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]"
              onMouseEnter={() => setHoveredColumn("col2")}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div
                className={`testimonial-scroll space-y-6 lg:space-y-8 ${
                  hoveredColumn === "col2" ? "paused" : ""
                }`}
                style={{
                  animationDelay: "20s",
                }}
              >
                {duplicatedTestimonials.map((testimonial, index) => (
                  <div
                    key={`col2-${index}`}
                    className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-7 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <Quote className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-indigo-100" />

                    <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      <p className="text-gray-700 italic leading-relaxed mb-6 text-sm sm:text-base">
                        &quot;{testimonial.content}&quot;
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 blur-sm opacity-70" />
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={50}
                            height={50}
                            className="relative rounded-full object-cover ring-2 ring-gray-200/60"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3 (only on lg screens) */}
            <div
              className="hidden lg:block relative overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]"
              onMouseEnter={() => setHoveredColumn("col3")}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div
                className={`testimonial-scroll space-y-6 lg:space-y-8 ${
                  hoveredColumn === "col3" ? "paused" : ""
                }`}
                style={{
                  animationDelay: "40s",
                }}
              >
                {duplicatedTestimonials.map((testimonial, index) => (
                  <div
                    key={`col3-${index}`}
                    className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-7 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <Quote className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-indigo-100" />

                    <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      <p className="text-gray-700 italic leading-relaxed mb-6 text-sm sm:text-base">
                        &quot;{testimonial.content}&quot;
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 blur-sm opacity-70" />
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={50}
                            height={50}
                            className="relative rounded-full object-cover ring-2 ring-gray-200/60"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
