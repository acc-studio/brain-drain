"use client";

import { useState } from "react";
import { CombinedCountryData } from "@/types/game";
import { createOrder } from "@/lib/actions"; // We will create this next

interface OrderFormProps {
    origin: CombinedCountryData | null; // The country we are moving FROM
    target: CombinedCountryData;        // The country we are moving TO
    onClose: () => void;
}

export default function OrderForm({ origin, target, onClose }: OrderFormProps) {
    const [amount, setAmount] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If we don't own the origin, we can't move from it.
    // For testing Season 0, let's assume we are "Player 1" (we'll fix auth later).
    // For now, allow moves from ANY country that has minds > 0.

    const maxMinds = origin?.minds_count || 0;

    const isAttack = origin?.owner_id !== target.owner_id && target.owner_id !== null;
    const isTransfer = !isAttack;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin) return;

        setIsSubmitting(true);

        // Call the Server Action (Step 2)
        await createOrder({
            originId: origin.country_id,
            targetId: target.country_id,
            amount: amount,
            type: isAttack ? "attack" : "transfer"
        });

        setIsSubmitting(false);
        onClose();
        alert("Order Queued for Midnight!");
    };

    if (!origin) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-600 p-6 rounded-xl w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">
                    {isAttack ? "⚔️ LAUNCH ATTACK" : "🚚 TRANSFER MINDS"}
                </h3>

                <div className="flex items-center justify-between text-slate-300 text-sm mb-6">
                    <span>From: <strong className="text-blue-400">{origin.name}</strong></span>
                    <span>To: <strong className="text-red-400">{target.name}</strong></span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs uppercase mb-1">Amount</label>
                        <input
                            type="number"
                            min={1}
                            max={maxMinds - 1} // Must leave 1 behind? Let's say yes for now.
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-right text-xs text-slate-500 mt-1">Available: {maxMinds}</p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || maxMinds < 2}
                            className={`flex-1 py-3 rounded font-bold text-black transition-transform active:scale-95 ${isAttack ? "bg-red-500 hover:bg-red-400" : "bg-blue-500 hover:bg-blue-400"
                                }`}
                        >
                            {isSubmitting ? "Sending..." : "Confirm Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}