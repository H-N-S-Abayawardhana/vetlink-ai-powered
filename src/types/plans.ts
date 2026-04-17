export interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceSubtext: string;
  premiumPrice?: string;
  premiumSubtext?: string;
  amount: number; // Amount in LKR (for payment)
  currency: string; // Default: "LKR"
  features: string[];
  extra: {
    title: string;
    description: string;
  };
  cta: string;
  popular: boolean;
  color: "indigo" | "teal";
  isFreeTrial: boolean; // If true, skip payment
}

export const PLANS: Plan[] = [
  {
    id: "pet-owners",
    name: "Pet Owners",
    subtitle: "B2C SAAS",
    price: "Free",
    priceSubtext: "Basic Plan",
    premiumPrice: "LKR 2,400",
    premiumSubtext: "Premium Monthly",
    amount: 2400,
    currency: "LKR",
    features: [
      "AI skin disease detection",
      "Behavioral tracking & alerts",
      "Personalized diet plans",
      "Nearby pharmacy finder",
      "Health score dashboard",
    ],
    extra: {
      title: "Tele-vet Consultations",
      description: "LKR 4,500 - 7,500 per session",
    },
    cta: "Start Free Trial",
    popular: false,
    color: "indigo",
    isFreeTrial: true, // Free trial, no payment needed
  },
  {
    id: "pet-pharmacies",
    name: "Pet Pharmacies",
    subtitle: "B2B COMMERCE",
    price: "LKR 10K",
    priceSubtext: "Monthly Subscription",
    amount: 10000,
    currency: "LKR",
    features: [
      "Inventory management",
      "Real-time clinic integration",
      "AI demand forecasting",
      "Automated reordering",
      "Targeted promotions",
    ],
    extra: {
      title: "Revenue Share",
      description: "SaaS License + 3% transaction commission",
    },
    cta: "Contact Sales",
    popular: true,
    color: "indigo",
    isFreeTrial: false,
  },
  {
    id: "veterinary-clinics",
    name: "Veterinary Clinics",
    subtitle: "B2B PROFESSIONAL",
    price: "Starting",
    priceSubtext: "",
    premiumPrice: "LKR 20K",
    premiumSubtext: "Monthly Subscription",
    amount: 20000,
    currency: "LKR",
    features: [
      "AI-assisted diagnostics",
      "Patient health records",
      "Analytics dashboard",
      "Pharmacy integration",
      "Multi-branch support",
    ],
    extra: {
      title: "Tiered SaaS",
      description: "Flexible pricing based on clinic size",
    },
    cta: "Get Custom Quote",
    popular: false,
    color: "teal",
    isFreeTrial: false,
  },
];
