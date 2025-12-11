"use client";

import { useState } from "react";
import { MoveRight, Sword, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Props {
    sourceId: string;
    targetId: string;
    maxMinds: number;
    isAttack: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function OrderModal({ sourceId, targetId, maxMinds, isAttack, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);

        // Get current User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Hardcoded Day 1 for now
        const dayNumber = 1;

        const { error } = await supabase.from("orders").insert({
            user_id: user.id,
            day_number: dayNumber,
            source_country_id: sourceId,
            target_country_id: targetId,
            minds: amount,
            order_type: isAttack ? 'attack' : 'transfer'
        });

        if (error) {
            alert("Order Failed: " + error.message);
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isAttack ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"}`}>
                        {isAttack ? <Sword className="w-6 h-6" /> : <MoveRight className="w-6 h-6" />}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                        {isAttack ? "Combat Order" : "Troop Transfer"}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        {sourceId.replace("_", " ")} <span className="text-slate-300 mx-1">→</span> {targetId.replace("_", " ")}
                    </p>
                </div>

                {/* Amount Slider */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase">
                        <span>Commit Force</span>
                        <span className="text-slate-900">{amount} Minds</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max={maxMinds - 1} // Must leave 1 behind
                        value={amount}
                        onChange={(e) => setAmount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                        <span>1</span>
                        <span>{maxMinds - 1} MAX</span>
                    </div>
                </div>

                {/* Warning if Attack */}
                {isAttack && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="text-xs text-red-700 leading-tight">
                            <strong>Combat Risk:</strong> Attacks are resolved at midnight using your Trivia Score + Dice rolls. Casualties expected.
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className="py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`py-3 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${isAttack ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"
                            }`}
                    >
                        {loading ? "Transmitting..." : "Confirm Order"}
                    </button>
                </div>

            </div>
        </div>
    );
}