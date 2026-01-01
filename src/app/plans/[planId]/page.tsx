"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles, ArrowLeft, CreditCard } from "lucide-react";
import { PLANS, Plan } from "@/types/plans";
import { formatLKR } from "@/lib/currency";
import { useSession } from "next-auth/react";

export default function PlanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const planId = params?.planId as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const foundPlan = PLANS.find((p) => p.id === planId);
    if (foundPlan) {
      setPlan(foundPlan);
    } else {
      router.push("/");
    }
  }, [planId, router]);

  const handlePayNow = async () => {
    if (!plan) return;

    // If it's a free trial, skip payment
    if (plan.isFreeTrial) {
      // Handle free trial activation
      alert("Free trial activated! Redirecting to dashboard...");
      router.push("/dashboard");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Generate order ID
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Call backend API to generate hash
      const response = await fetch("/api/payhere/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount: plan.amount,
          currency: plan.currency,
          planId: plan.id,
          planName: plan.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // Create form and submit to PayHere
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkoutUrl; // Use checkout URL from API (sandbox or production)

      // Use the exact same amount format as used in hash generation
      const formattedAmount = data.amount; // Use amount from API response (already formatted)

      // Add all required fields in the order PayHere expects
      const baseUrl = window.location.origin;
      const fields: Record<string, string> = {
        merchant_id: data.merchantId,
        return_url: `${baseUrl}/payment/success`,
        cancel_url: `${baseUrl}/payment/cancel`,
        notify_url: `${baseUrl}/api/payhere/notify`,
        order_id: orderId,
        items: plan.name,
        amount: formattedAmount,
        currency: data.currency,
        first_name: (session?.user?.username || "Customer").split(" ")[0] || "Customer",
        last_name: (session?.user?.username || "").split(" ").slice(1).join(" ") || "User",
        email: session?.user?.email || "customer@example.com",
        phone: "0771234567",
        address: "No 123, Main Street",
        city: "Colombo",
        country: "Sri Lanka",
        hash: data.hash,
      };

      // Add fields in specific order (hash should be last)
      // PayHere expects fields in a certain order
      const fieldOrder = [
        "merchant_id",
        "return_url",
        "cancel_url",
        "notify_url",
        "order_id",
        "items",
        "amount",
        "currency",
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "city",
        "country",
        "hash", // Hash must be last
      ];

      fieldOrder.forEach((key) => {
        if (fields[key]) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(fields[key]);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Plans</span>
        </motion.button>

        {/* Plan Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-3xl border overflow-hidden shadow-xl ${
            plan.popular
              ? "border-indigo-300/60 shadow-indigo-500/10"
              : "border-gray-200/60"
          }`}
        >
          {/* Header */}
          <div
            className={`p-8 ${
              plan.color === "indigo"
                ? "bg-gradient-to-br from-indigo-50 to-indigo-100/50"
                : "bg-gradient-to-br from-teal-50 to-teal-100/50"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
                  plan.color === "indigo"
                    ? "bg-indigo-600"
                    : "bg-teal-600"
                }`}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {plan.name}
                </h1>
                <p className="text-gray-600">{plan.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Pricing */}
            <div className="text-center mb-8 pb-8 border-b border-gray-200">
              {plan.premiumPrice ? (
                <>
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {plan.price}
                  </div>
                  <div className="text-gray-500 mb-4">{plan.priceSubtext}</div>
                  <div
                    className={`text-4xl font-bold mb-2 ${
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
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {plan.price}
                  </div>
                  <div className="text-gray-500">{plan.priceSubtext}</div>
                </>
              )}
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                What's Included
              </h2>
              <div className="space-y-4">
                {plan.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CheckCircle
                      className={`mt-0.5 h-6 w-6 flex-shrink-0 ${
                        plan.color === "indigo"
                          ? "text-indigo-600"
                          : "text-teal-600"
                      }`}
                    />
                    <span className="text-gray-700 text-base leading-relaxed">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Extra info */}
            <div
              className={`rounded-xl border p-6 mb-8 ${
                plan.color === "indigo"
                  ? "border-indigo-200/50 bg-indigo-50/30"
                  : "border-teal-200/50 bg-teal-50/30"
              }`}
            >
              <p className="text-base text-gray-900 font-semibold mb-2">
                {plan.extra.title}
              </p>
              <p className="text-sm text-gray-600">{plan.extra.description}</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Pay Now Button */}
            {plan.isFreeTrial ? (
              <motion.button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full rounded-xl py-4 font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Start Free Trial</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={handlePayNow}
                disabled={isProcessing}
                className={`w-full rounded-xl py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                    : "bg-white text-gray-700 ring-1 ring-gray-200/60 hover:bg-gray-50 hover:ring-indigo-200/60"
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay Now - {formatLKR(plan.amount)}</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

