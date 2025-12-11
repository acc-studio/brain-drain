"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Brain, ArrowRight, Loader2, AlertCircle, Lock, Mail, Key, User } from "lucide-react";

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
            setError("Authentication Failed: " + signInError.message);
            setLoading(false);
        } else {
            window.location.reload();
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // 1. Basic Client-side Validation
        if (!accessCode) {
            setError("Access Code is required.");
            setLoading(false);
            return;
        }

        // 2. Sign Up with Meta Data
        // The Database Trigger will validate the 'access_code' and block the user if invalid.
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
            // SHOW THE REAL ERROR
            // Supabase returns "Database error saving new user: <Trigger Message>"
            // We want to see that Trigger Message.
            console.error("Full Error:", signUpError);
            setError(signUpError.message);
        } else {
            window.location.reload();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl relative">

                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
                        <Brain className="w-7 h-7 text-teal-400" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">BRAIN DRAIN</h1>
                    <p className="text-slate-500 font-medium text-sm">Season 0: The Awakening</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 mb-6">
                    <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 pb-3 text-sm font-bold transition-colors ${mode === "login" ? "text-teal-600 border-b-2 border-teal-500" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        Operative Login
                    </button>
                    <button
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 pb-3 text-sm font-bold transition-colors ${mode === "register" ? "text-teal-600 border-b-2 border-teal-500" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        Activate Access Code
                    </button>
                </div>

                {/* LOGIN FORM */}
                {mode === "login" && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                        </button>
                    </form>
                )}

                {/* REGISTER FORM */}
                {mode === "register" && (
                    <form onSubmit={handleRegister} className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">

                        {/* Access Code Field */}
                        <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-100 space-y-1">
                            <label className="text-[10px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                                <Key className="w-3 h-3" /> Authorization Code
                            </label>
                            <input
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full bg-white border border-teal-200 text-teal-900 font-mono font-bold text-center py-2 rounded uppercase tracking-widest focus:outline-none focus:border-teal-500"
                                placeholder="XXXX-XXXX"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operative Alias</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="CommanderX"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="name@ex.com"
                                    required
                                />
                            </div>

                            <div className="space-y-1 col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    Verify & Initialize <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

            </div>
        </div>
    );
}