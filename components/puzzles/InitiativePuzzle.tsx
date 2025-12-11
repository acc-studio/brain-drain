"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Props {
    user: any;
    dayNumber: number;
    onComplete: () => void;
    onClose: () => void;
}

const MAX_GUESSES = 6;

export default function InitiativePuzzle({ user, dayNumber, onComplete, onClose }: Props) {
    const supabase = createClient();
    const [solution, setSolution] = useState<string>("");
    const [wordLength, setWordLength] = useState(5); // Dynamic

    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
    const [loading, setLoading] = useState(true);

    // 1. Fetch Today's Solution
    useEffect(() => {
        const fetchPuzzle = async () => {
            const { data } = await supabase
                .from("daily_puzzles")
                .select("wordle_solution")
                .eq("day_number", dayNumber)
                .single();

            if (data && data.wordle_solution) {
                const word = data.wordle_solution.toUpperCase();
                setSolution(word);
                setWordLength(word.length);
                setLoading(false);
            } else {
                // Fallback if day hasn't been generated yet
                setSolution("ERROR");
                setLoading(false);
            }
        };
        fetchPuzzle();
    }, [dayNumber]);

    const saveResult = async (guessCount: number) => {
        if (!user) return;
        const { error } = await supabase.from("daily_performance").upsert({
            user_id: user.id,
            day_number: dayNumber,
            wordle_guesses: guessCount,
            wordle_completed_at: new Date().toISOString(),
        });
        if (!error) setTimeout(onComplete, 1500);
    };

    const handleKeyDown = useCallback((key: string) => {
        if (gameStatus !== "playing" || loading) return;

        if (key === "BACKSPACE") {
            setCurrentGuess((prev) => prev.slice(0, -1));
            return;
        }

        if (key === "ENTER") {
            if (currentGuess.length !== wordLength) return;

            const newGuesses = [...guesses, currentGuess];
            setGuesses(newGuesses);
            setCurrentGuess("");

            if (currentGuess === solution) {
                setGameStatus("won");
                saveResult(newGuesses.length);
            } else if (newGuesses.length >= MAX_GUESSES) {
                setGameStatus("lost");
                saveResult(7);
            }
            return;
        }

        if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
            setCurrentGuess((prev) => prev + key);
        }
    }, [currentGuess, gameStatus, guesses, solution, loading, wordLength]);

    useEffect(() => {
        const handleWindowKey = (e: KeyboardEvent) => handleKeyDown(e.key.toUpperCase());
        window.addEventListener("keydown", handleWindowKey);
        return () => window.removeEventListener("keydown", handleWindowKey);
    }, [handleKeyDown]);

    const getCellColor = (letter: string, index: number, rowIndex: number) => {
        if (rowIndex >= guesses.length) return "bg-white border-slate-300 text-slate-900";
        const isCorrectPosition = solution[index] === letter;
        const isInWord = solution.includes(letter);
        if (isCorrectPosition) return "bg-teal-500 border-teal-500 text-white";
        if (isInWord) return "bg-amber-500 border-amber-500 text-white";
        return "bg-slate-400 border-slate-400 text-white";
    };

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-slate-50 border border-slate-200 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">INITIATIVE PROTOCOL</h2>
                        <p className="text-xs text-slate-500 uppercase">Day {dayNumber} // {wordLength} Letter Code</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="space-y-2 mb-8">
                    {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
                        const rowWord = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : "");
                        return (
                            <div key={rowIndex} className="flex gap-2 justify-center">
                                {Array.from({ length: wordLength }).map((_, colIndex) => {
                                    const letter = rowWord[colIndex] || "";
                                    return (
                                        <div
                                            key={colIndex}
                                            className={`w-10 h-10 sm:w-12 sm:h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold transition-colors duration-300 ${getCellColor(letter, colIndex, rowIndex)}`}
                                        >
                                            {letter}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div className="text-center h-12">
                    {gameStatus === "won" && (
                        <div className="flex items-center justify-center gap-2 text-teal-600 font-bold animate-bounce">
                            <CheckCircle className="w-5 h-5" />
                            <span>ACCESS GRANTED: TIER {guesses.length <= 2 ? "1" : guesses.length <= 4 ? "2" : "3"}</span>
                        </div>
                    )}
                    {gameStatus === "lost" && (
                        <div className="flex items-center justify-center gap-2 text-red-500 font-bold">
                            <AlertCircle className="w-5 h-5" />
                            <span>ACCESS DENIED (Solution: {solution})</span>
                        </div>
                    )}
                    {gameStatus === "playing" && (
                        <p className="text-slate-400 text-sm font-mono">INPUT {wordLength}-CHAR SEQUENCE...</p>
                    )}
                </div>

            </div>
        </div>
    );
}