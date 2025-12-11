"use client";

import { useState, useEffect } from "react";
import { MoveRight, Sword, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Props {
    sourceId: string;
    targetId: string;
    maxMinds: number;
    isAttack: boolean;
    isExploration: boolean;
    targetMinds: number;
    dayNumber: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function OrderModal({ sourceId, targetId, maxMinds, isAttack, isExploration, targetMinds, dayNumber, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [winChance, setWinChance] = useState<string | null>(null);

    // --- SIMULATE ODDS (Only for combat) ---
    useEffect(() => {
        if (!isAttack || isExploration) { setWinChance(null); return; }

        const SIM_RUNS = 500;
        let wins = 0;

        for (let i = 0; i < SIM_RUNS; i++) {
            let att = amount;
            let def = targetMinds;

            // Total War Logic (Unlimited Dice)
            while (att > 0 && def > 0) {
                const attRolls = Array.from({ length: att }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
                const defRolls = Array.from({ length: def }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
                const pairs = Math.min(att, def);

                for (let j = 0; j < pairs; j++) {
                    if (attRolls[j] > defRolls[j]) def--;
                    else att--;
                }
            }
            if (att > 0) wins++;
        }

        setWinChance(((wins / SIM_RUNS) * 100).toFixed(1) + "%");
    }, [amount, isAttack, isExploration, targetMinds]);

    const handleSubmit = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let type = 'transfer';
        if (isAttack) type = 'attack';
        if (isExploration) type = 'explore';

        const { error } = await supabase.from("orders").insert({
            user_id: user.id,
            day_number: dayNumber,
            source_country_id: sourceId,
            target_country_id: targetId,
            minds: amount,
            order_type: type
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
                <div className="text-center mb-6">
                    <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isAttack ? "bg-red-50 text-red-600" : isExploration ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                        {isAttack ? <Sword className="w-6 h-6" /> : isExploration ? <MoveRight className="w-6 h-6" /> : <MoveRight className="w-6 h-6" />}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                        {isAttack ? "Combat Order" : isExploration ? "Exploration" : "Troop Transfer"}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">{sourceId.replace("_", " ")} <span className="text-slate-300 mx-1">→</span> {targetId.replace("_", " ")}</p>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase">
                        <span>Commit Force</span>
                        <div className="text-right">
                            <span className="text-slate-900 block">{amount} Minds</span>
                            {isAttack && winChance && <span className={`text-[10px] ${parseFloat(winChance) > 50 ? 'text-teal-500' : 'text-red-500'}`}>Win Chance: {winChance}</span>}
                        </div>
                    </div>
                    <input type="range" min="1" max={Math.max(1, maxMinds - 1)} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono"><span>1</span><span>{Math.max(1, maxMinds - 1)} MAX</span></div>
                </div>

                {isExploration && (
                    <div className={`mb-6 p-3 border rounded-lg flex gap-3 ${amount >= targetMinds ? "bg-indigo-50 border-indigo-100" : "bg-amber-50 border-amber-100"}`}>
                        <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${amount >= targetMinds ? "text-indigo-500" : "text-amber-500"}`} />
                        <div className={`text-xs leading-tight ${amount >= targetMinds ? "text-indigo-700" : "text-amber-700"}`}>
                            {amount >= targetMinds
                                ? <span><strong>Success Guaranteed:</strong> You will annex this region and gain <strong>+{Math.floor(targetMinds / 2)}</strong> bonus troops.</span>
                                : <span><strong>Insufficient Force:</strong> You need at least <strong>{targetMinds}</strong> minds to convert the locals. Your troops will return.</span>
                            }
                        </div>
                    </div>
                )}

                {isAttack && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="text-xs text-red-700 leading-tight"><strong>Combat Risk:</strong> Casualties expected.</div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className={`py-3 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${isAttack ? "bg-red-600 hover:bg-red-700" : isExploration ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"}`}>{loading ? "Transmitting..." : "Confirm Order"}</button>
                </div>
            </div>
        </div>
    );
}