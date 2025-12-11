"use client";

import { ScrollText, Swords, Flag } from "lucide-react";

interface LogEntry {
    id: string;
    message: string;
    type: 'info' | 'combat' | 'conquest';
    created_at: string;
}

export default function GameLog({ logs }: { logs: LogEntry[] }) {
    if (logs.length === 0) {
        return (
            <div className="p-4 text-center text-xs text-slate-400 italic">
                Awaiting daily resolution...
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3 items-start border-b border-slate-50 pb-2 last:border-0">
                    <div className="mt-0.5 flex-shrink-0">
                        {log.type === 'combat' && <Swords className="w-3 h-3 text-red-500" />}
                        {log.type === 'conquest' && <Flag className="w-3 h-3 text-teal-600" />}
                        {log.type === 'info' && <ScrollText className="w-3 h-3 text-slate-400" />}
                    </div>
                    <div className="text-xs text-slate-600 leading-snug">
                        {log.message}
                        <div className="text-[9px] text-slate-300 mt-1">
                            {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}