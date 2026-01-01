import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// PayHere checkout URLs
const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const PAYHERE_PRODUCTION_URL = "https://www.payhere.lk/pay/checkout";

interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  planId: string;
  planName: string;
}

/**
 * Generate PayHere hash
 * PayHere uses a nested hash formula:
 * hash = to_upper_case(md5(merchant_id + order_id + amount + currency + to_upper_case(md5(merchant_secret))))
 * 
 * Steps:
 * 1. Hash the merchant_secret: md5(merchant_secret)
 * 2. Convert to uppercase
 * 3. Concatenate: merchant_id + order_id + amount + currency + hashed_secret
 * 4. Hash the concatenated string: md5(concatenated_string)
 * 5. Convert final hash to uppercase
 */
function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string,
): string {
  // Step 1 & 2: Hash merchant_secret and convert to uppercase
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();
  
  // Step 3: Concatenate all values
  const hashString = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
  
  // Step 4 & 5: Hash the concatenated string and convert to uppercase
  const finalHash = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();
  
  return finalHash;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body: CreatePaymentRequest = await request.json();
    const { orderId, amount, currency, planId, planName } = body;

    // Validate required fields
    if (!orderId || !amount || !currency || !planId) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount, currency, planId" },
        { status: 400 },
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 },
      );
    }

    // Get PayHere credentials from environment variables
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    let merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      console.error("PayHere credentials not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    // PayHere merchant secret handling
    // The secret from dashboard is base64 encoded - decode it before use
    let secretForHash = merchantSecret;
    const cleanedSecret = merchantSecret.replace(/[:=]+$/, "");
    
    try {
      secretForHash = Buffer.from(cleanedSecret, "base64").toString("utf-8");
    } catch (error) {
      // If decoding fails, the secret might already be in plain text
      secretForHash = cleanedSecret;
    }

    // Format amount to 2 decimal places (must match exactly in form submission)
    const formattedAmount = parseFloat(amount.toString()).toFixed(2);

    // Generate hash (must use exact same values as in form)
    const hash = generatePayHereHash(
      merchantId,
      orderId,
      formattedAmount,
      currency,
      secretForHash,
    );

    // Determine checkout URL - use sandbox by default, production if PAYHERE_ENV=production
    const checkoutUrl = process.env.PAYHERE_ENV === "production" 
      ? PAYHERE_PRODUCTION_URL 
      : PAYHERE_SANDBOX_URL;

    return NextResponse.json({
      success: true,
      merchantId,
      orderId,
      amount: formattedAmount,
      currency,
      hash,
      checkoutUrl,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}

