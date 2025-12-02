"use server";

import { supabase } from "@/lib/supabaseClient";

interface OrderData {
    originId: string;
    targetId: string;
    amount: number;
    type: "transfer" | "attack";
}

export async function createOrder(data: OrderData) {
    // Insert order into Supabase
    const { error } = await supabase.from("orders").insert({
        origin_country: data.originId,
        target_country: data.targetId,
        minds_amount: data.amount,
        order_type: data.type,
        day_number: 1, // Hardcoded Day 1 for now
    });

    if (error) {
        console.error("Order failed:", error);
        throw new Error("Failed to place order");
    }

    return { success: true };
}