import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const PAYHERE_PRODUCTION_URL = "https://www.payhere.lk/pay/checkout";

function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string,
): string {
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();
  const hashString = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
  return crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();
}

/** POST /api/payhere/create-pharmacy-payment - Get PayHere params for a pharmacy order */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, itemName } = body;

    if (!orderId || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid orderId, amount" },
        { status: 400 },
      );
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    let merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    let secretForHash = merchantSecret;
    const cleanedSecret = merchantSecret.replace(/[:=]+$/, "");
    try {
      secretForHash = Buffer.from(cleanedSecret, "base64").toString("utf-8");
    } catch {
      secretForHash = cleanedSecret;
    }

    const currency = "LKR";
    const formattedAmount = parseFloat(Number(amount).toString()).toFixed(2);
    const hash = generatePayHereHash(
      merchantId,
      orderId,
      formattedAmount,
      currency,
      secretForHash,
    );

    const checkoutUrl =
      process.env.PAYHERE_ENV === "production"
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
      itemName: itemName || "Pharmacy Order",
    });
  } catch (error) {
    console.error("Error creating pharmacy payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
