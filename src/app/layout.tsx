import type { Metadata } from "next";
import { Inter } from "next/font/google"; // or whatever font you have
import "./globals.css"; // <--- THIS is the only css import you need

// DO NOT import "tailwindcss" here.
// DO NOT import any config files here.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Brain Drain",
    description: "Strategy Game",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}