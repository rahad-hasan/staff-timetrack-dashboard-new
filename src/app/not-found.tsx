"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-6 text-white">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-10 top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-[90px]" />
        <div className="absolute bottom-20 left-10 h-52 w-52 rounded-full bg-indigo-500/20 blur-[90px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] bg-[size:44px_44px]" />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto flex max-w-2xl flex-col items-center text-center"
      >
        {/* Floating icon */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-md"
        >
          <Search className="h-9 w-9 text-cyan-300" />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-300 backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Page not found
        </motion.div>

        {/* 404 Text */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-gradient-to-b from-white to-slate-500 bg-clip-text text-8xl font-black tracking-tighter text-transparent sm:text-9xl"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Oops! This page disappeared
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-4 max-w-md text-base leading-7 text-slate-400"
        >
          The page you are looking for may have been moved, deleted, or never
          existed. Let&apos;s get you back on track.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-cyan-400 px-7 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-300 hover:shadow-cyan-500/40"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-white/15 bg-white/5 px-7 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </motion.div>
      </motion.section>

      {/* Decorative floating dots */}
      <motion.div
        animate={{ y: [0, -16, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[18%] top-[25%] h-3 w-3 rounded-full bg-cyan-300"
      />

      <motion.div
        animate={{ y: [0, 18, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[28%] right-[20%] h-4 w-4 rounded-full bg-blue-400"
      />

      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[30%] top-[18%] h-2 w-2 rounded-full bg-indigo-300"
      />
    </main>
  );
}