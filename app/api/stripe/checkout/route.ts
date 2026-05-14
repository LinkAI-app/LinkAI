import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",

      customer_email: profile?.email || undefined,

      metadata: {
        userId,
      },

      subscription_data: {
        metadata: {
          userId,
        },
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "LinkAI Premium",
              description:
                "AI creator tools, viral hooks, video analysis, and premium growth tools.",
            },
            unit_amount: 1999,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],

      success_url: "https://linkaiapp.ai/dashboard?payment=success",
      cancel_url: "https://linkaiapp.ai/dashboard?payment=cancelled",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("STRIPE CHECKOUT ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Stripe checkout failed" },
      { status: 500 }
    );
  }
}