"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Terminal, RefreshCcw, MoveLeft, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-white text-black overflow-hidden font-mono">
      {/* 1. Scanning Line Animation */}
      <motion.div 
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-[2px] bg-black/5 z-20 pointer-events-none"
      />

      {/* 2. Background Large Text Layer */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
        <h1 className="text-[30vw] font-bold leading-none">ERROR</h1>
      </div>

      {/* 3. Main Content Container */}
      <div className="relative z-10 w-full max-w-2xl border-x border-black/10 px-8 py-16 flex flex-col items-center">
        
        {/* Terminal Header Decor */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 border-b border-black/10 text-[10px] uppercase tracking-widest text-black/40">
          <span>Status: 404_NOT_FOUND</span>
          <span>System: Root_Dir</span>
        </div>

        {/* 4. The Glitched 404 */}
        <div className="relative mb-12">
          <motion.h1 
            animate={{ 
              x: [0, -2, 2, -1, 0],
              opacity: [1, 0.8, 1, 0.9, 1]
            }}
            transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
            className="text-9xl md:text-[12rem] font-bold tracking-tighter"
          >
            404
          </motion.h1>
          
          {/* Subtle "Slice" Effect */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white z-10" />
        </div>

        {/* 5. Message with Typing Simulation */}
        <div className="text-center space-y-6 max-w-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <h2 className="text-lg font-bold uppercase tracking-tight flex items-center justify-center gap-2">
              <Terminal size={18} />
              Path_Invalid_Exception
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              The requested resource at <code className="bg-gray-100 px-1 italic">window.location</code> does not exist or has been moved to a restricted sector.
            </p>
          </motion.div>

          <motion.div 
          className="flex flex-col items-center gap-3"
        >
          <Link
            href="/"
            className="relative flex items-center gap-3 py-2 text-sm font-medium group"
          >
            <span className="relative z-10 text-black">Return to Surface</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 origin-right transition-transform duration-500 scale-x-100 group-hover:scale-x-0" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black origin-left transition-transform duration-500 scale-x-0 group-hover:scale-x-100" />
          </Link>

          <button
            onClick={() => router.back()}
            className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            Stay Lost or [ Go Back ]
          </button>
        </motion.div>

          {/* 6. Action Buttons (Brutalist Style) */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors duration-300 font-bold uppercase text-xs"
            >
              <MoveLeft size={14} />
              Revert to Previous State
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors duration-300 font-bold uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
            >
              <RefreshCcw size={14} />
              Reset System
            </button>
          </div>
        </div>

        {/* Bottom Corner Decor */}
        <div className="absolute bottom-2 right-4 text-[10px] text-black/20 italic">
          [null_pointer_address_0x004]
        </div>
      </div>

      {/* Background Decorative Crosses */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`absolute text-black/10 text-xl font-light ${
          i === 0 ? "top-10 left-10" : 
          i === 1 ? "top-10 right-10" : 
          i === 2 ? "bottom-10 left-10" : "bottom-10 right-10"
        }`}>+</div>
      ))}
    </div>
  )
}