"use client";

import { X, MoveRight, Sword } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

interface Order {
    id: string;
    source_country_id: string;
    target_country_id: string;
    order_type: 'transfer' | 'attack';
    minds: number;
}

interface Props {
    orders: Order[];
    onUpdate: () => void;
}

export default function PendingOrders({ orders, onUpdate }: Props) {
    const supabase = createClient();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleCancel = async (orderId: string) => {
        setLoadingId(orderId);
        await supabase.from("orders").delete().eq("id", orderId);
        setLoadingId(null);
        onUpdate(); // Trigger refresh in parent
    };

    if (orders.length === 0) {
        return (
            <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                No orders queued.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-slate-300 transition-all">

                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${order.order_type === 'attack' ? 'bg-red-500' : 'bg-teal-500'}`}>
                            {order.minds}
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 uppercase">
                                <span>{order.source_country_id.replace("_", " ")}</span>
                                <span className="text-slate-400">→</span>
                                <span className={order.order_type === 'attack' ? 'text-red-600' : 'text-teal-600'}>
                                    {order.target_country_id.replace("_", " ")}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                {order.order_type === 'attack' ? <Sword className="w-3 h-3" /> : <MoveRight className="w-3 h-3" />}
                                {order.order_type}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleCancel(order.id)}
                        disabled={loadingId === order.id}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Rescind Order"
                    >
                        {loadingId === order.id ? (
                            <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                            <X className="w-4 h-4" />
                        )}
                    </button>

                </div>
            ))}
        </div>
    );
}