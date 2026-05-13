import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      mode: "subscription",

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: "LinkAI Premium",
              description:
                "AI creator tools, viral hooks, video analysis, and premium growth features.",
            },

            unit_amount: 1999,
            recurring: {
              interval: "month",
            },
          },

          quantity: 1,
        },
      ],

      success_url:
        "https://linkaiapp.ai/dashboard?payment=success",

      cancel_url:
        "https://linkaiapp.ai/dashboard?payment=cancelled",
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}