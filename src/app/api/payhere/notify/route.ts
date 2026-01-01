import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * PayHere Notify Endpoint
 * This endpoint receives payment notifications from PayHere
 * after a payment is completed or failed.
 *
 * PayHere will send a POST request to this endpoint with payment details.
 * You should verify the hash to ensure the request is from PayHere.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract payment details from PayHere
    const merchantId = formData.get("merchant_id") as string;
    const orderId = formData.get("order_id") as string;
    const paymentId = formData.get("payment_id") as string;
    const payhereAmount = formData.get("payhere_amount") as string;
    const payhereCurrency = formData.get("payhere_currency") as string;
    const statusCode = formData.get("status_code") as string;
    const md5sig = formData.get("md5sig") as string;
    const statusMessage = formData.get("status_message") as string;
    const method = formData.get("method") as string;
    const custom1 = formData.get("custom_1") as string;
    const custom2 = formData.get("custom_2") as string;

    // Get merchant secret from environment
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
      console.error("PayHere merchant secret not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    // Verify hash
    // PayHere hash = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchant_secret)
    const hashString = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${merchantSecret}`;
    const calculatedHash = crypto
      .createHash("md5")
      .update(hashString)
      .digest("hex")
      .toUpperCase();

    // Verify the hash matches
    if (calculatedHash !== md5sig) {
      console.error("Invalid hash from PayHere");
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    // Payment status codes:
    // 2 = Success
    // 0 = Pending
    // -1 = Canceled
    // -2 = Failed
    // -3 = Charged Back

    const paymentStatus =
      {
        "2": "success",
        "0": "pending",
        "-1": "canceled",
        "-2": "failed",
        "-3": "charged_back",
      }[statusCode] || "unknown";

    // TODO: Store payment notification in your database
    // Example: await updatePaymentStatus(orderId, { ... });

    // TODO: Update your database with payment status
    // Example:
    // await updatePaymentStatus(orderId, {
    //   paymentId,
    //   status: paymentStatus,
    //   amount: parseFloat(payhereAmount),
    //   currency: payhereCurrency,
    //   method,
    //   completedAt: new Date(),
    // });

    // Return success response to PayHere
    // PayHere expects a 200 status code
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing PayHere notification:", error);
    return NextResponse.json(
      { error: "Failed to process notification" },
      { status: 500 },
    );
  }
}
