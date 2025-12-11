"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Brain, ArrowRight, Loader2, AlertCircle, Mail, Key, User, Lock } from "lucide-react";

export default function AuthOverlay() {
    const supabase = createClient();
    const [mode, setMode] = useState<"login" | "register">("login");

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [accessCode, setAccessCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
        } else {
            window.location.reload();
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!accessCode) {
            setError("Access Code is required.");
            setLoading(false);
            return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    access_code: accessCode.trim().toUpperCase()
                }
            }
        });

        if (signUpError) {
            console.error("Signup Error:", signUpError);
            setError(signUpError.message);
        } else {
            window.location.reload();
        }
        setLoading(false);
    };

    // Shared Input Styles for Maximum Readability
    const inputClass = "w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-black font-medium focus:border-teal-600 focus:outline-none transition-colors placeholder:text-slate-400";
    const labelClass = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md bg-white border border-slate-300 p-8 rounded-2xl shadow-2xl relative">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
                        <Brain className="w-6 h-6 text-teal-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">BRAIN DRAIN</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-slate-100 mb-8">
                    <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 pb-3 text-sm font-bold transition-colors ${mode === "login" ? "text-teal-700 border-b-4 border-teal-600 -mb-[2px]" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        LOGIN
                    </button>
                    <button
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 pb-3 text-sm font-bold transition-colors ${mode === "register" ? "text-teal-700 border-b-4 border-teal-600 -mb-[2px]" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        REGISTER
                    </button>
                </div>

                {/* LOGIN FORM */}
                {mode === "login" && (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`${inputClass} pl-12`}
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputClass} pl-12`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xl mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTER WAR ROOM"}
                        </button>
                    </form>
                )}

                {/* REGISTER FORM */}
                {mode === "register" && (
                    <form onSubmit={handleRegister} className="space-y-4">

                        {/* Access Code */}
                        <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                            <label className="block text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                                Authorization Code
                            </label>
                            <div className="relative">
                                <Key className="absolute left-4 top-3.5 w-5 h-5 text-teal-600 pointer-events-none" />
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-teal-200 rounded-lg text-teal-900 font-bold uppercase tracking-widest focus:border-teal-600 focus:outline-none placeholder:text-teal-300/50"
                                    placeholder="ALPHA-1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className={labelClass}>Operative Alias</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={`${inputClass} pl-12`}
                                        placeholder="CommanderX"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xl mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    INITIALIZE ACCOUNT <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Error Box */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

            </div>
        </div>
    );
}