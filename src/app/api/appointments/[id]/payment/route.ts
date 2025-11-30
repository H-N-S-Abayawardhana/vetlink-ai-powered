import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/types/next-auth';

// POST /api/appointments/[id]/payment - Process payment for appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only USER role can make payments
    if (session.user.userRole !== 'USER') {
      return NextResponse.json(
        { error: 'Only users can make payments' },
        { status: 403 }
      );
    }

    const { id: appointmentId } = await params;
    const body = await request.json();
    const { 
      payment_method,
      amount,
      payment_details 
    } = body;

    // Validate required fields
    if (!payment_method || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: payment_method, amount' },
        { status: 400 }
      );
    }

    // Get current appointment
    const appointmentResult = await pool.query(
      `SELECT 
        a.*,
        u.username as user_name,
        u.email as user_email,
        v.username as veterinarian_name,
        v.email as veterinarian_email
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN users v ON a.veterinarian_id = v.id
      WHERE a.id = $1`,
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const appointment = appointmentResult.rows[0];

    // Check if user owns this appointment
    if (appointment.user_id !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if appointment is accepted
    if (appointment.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Payment can only be made for accepted appointments' },
        { status: 400 }
      );
    }

    // Check if already paid
    if (appointment.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Appointment is already paid' },
        { status: 400 }
      );
    }

    // Validate amount (you can set your own pricing logic here)
    const expectedAmount = 50; // Default consultation fee - you can make this dynamic
    if (parseFloat(amount) !== expectedAmount) {
      return NextResponse.json(
        { error: `Invalid amount. Expected $${expectedAmount}` },
        { status: 400 }
      );
    }

    // Simulate payment processing
    // In a real application, you would integrate with payment gateways like Stripe, PayPal, etc.
    const paymentResult = await processPayment({
      appointmentId: parseInt(appointmentId),
      amount: parseFloat(amount),
      paymentMethod: payment_method,
      paymentDetails: payment_details,
      userEmail: appointment.user_email,
      veterinarianEmail: appointment.veterinarian_email
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Payment processing failed', details: paymentResult.error },
        { status: 400 }
      );
    }

    // Update appointment payment status
    const updateResult = await pool.query(
      `UPDATE appointments 
       SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [appointmentId]
    );

    return NextResponse.json({
      success: true,
      appointment: updateResult.rows[0],
      payment: paymentResult.payment,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

// Simulate payment processing
async function processPayment(paymentData: {
  appointmentId: number;
  amount: number;
  paymentMethod: string;
  paymentDetails: any;
  userEmail: string;
  veterinarianEmail: string;
}) {
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real application, you would:
    // 1. Validate payment details
    // 2. Process payment through payment gateway (Stripe, PayPal, etc.)
    // 3. Handle payment failures and retries
    // 4. Store payment transaction details

    // For demo purposes, we'll simulate a successful payment
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // You could store payment details in a separate payments table
    // For now, we'll just return the payment result
    
    return {
      success: true,
      payment: {
        id: paymentId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
        status: 'completed',
        processedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: 'Payment processing failed'
    };
  }
}
