"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Terminal, RefreshCcw, MoveLeft, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  const router = useRouter()

  return (
    // <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white font-mono text-black">
    //   {/* 1. Scanning Line Animation */}
    //   <motion.div
    //     initial={{ top: "-10%" }}
    //     animate={{ top: "110%" }}
    //     transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    //     className="pointer-events-none absolute left-0 z-20 h-[2px] w-full bg-black/5"
    //   />

    //   {/* 2. Background Large Text Layer */}
    //   <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
    //     <h1 className="text-[30vw] leading-none font-bold">ERROR</h1>
    //   </div>

    //   {/* 3. Main Content Container */}
    //   <div className="relative z-10 flex w-full max-w-2xl flex-col items-center border-x border-black/10 px-8 py-16">
    //     {/* Terminal Header Decor */}
    //     <div className="absolute top-0 left-0 flex w-full items-center justify-between border-b border-black/10 px-4 py-2 text-[10px] tracking-widest text-black/40 uppercase">
    //       <span>Status: 404_NOT_FOUND</span>
    //       <span>System: Root_Dir</span>
    //     </div>

    //     {/* 4. The Glitched 404 */}
    //     <div className="relative mb-12">
    //       <motion.h1
    //         animate={{
    //           x: [0, -2, 2, -1, 0],
    //           opacity: [1, 0.8, 1, 0.9, 1],
    //         }}
    //         transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
    //         className="text-9xl font-bold tracking-tighter md:text-[12rem]"
    //       >
    //         404
    //       </motion.h1>

    //       {/* Subtle "Slice" Effect */}
    //       <div className="absolute top-1/2 left-0 z-10 h-[1px] w-full bg-white" />
    //     </div>

    //     {/* 5. Message with Typing Simulation */}
    //     <div className="max-w-sm space-y-6 text-center">
    //       <motion.div
    //         initial={{ opacity: 0 }}
    //         animate={{ opacity: 1 }}
    //         className="space-y-2"
    //       >
    //         <h2 className="flex items-center justify-center gap-2 text-lg font-bold tracking-tight uppercase">
    //           <Terminal size={18} />
    //           Path_Invalid_Exception
    //         </h2>
    //         <p className="text-sm leading-relaxed text-gray-500">
    //           The requested resource at{" "}
    //           <code className="bg-gray-100 px-1 italic">window.location</code>{" "}
    //           does not exist or has been moved to a restricted sector.
    //         </p>
    //       </motion.div>

    //       <motion.div className="flex flex-col items-center gap-3">
    //         <Link
    //           href="/"
    //           className="group relative flex items-center gap-3 py-2 text-sm font-medium"
    //         >
    //           <span className="relative z-10 text-black">
    //             Return to Surface
    //           </span>
    //           <ArrowUpRight
    //             size={16}
    //             className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
    //           />
    //           <div className="absolute bottom-0 left-0 h-[1px] w-full origin-right scale-x-100 bg-black/10 transition-transform duration-500 group-hover:scale-x-0" />
    //           <div className="absolute bottom-0 left-0 h-[1px] w-full origin-left scale-x-0 bg-black transition-transform duration-500 group-hover:scale-x-100" />
    //         </Link>

    //         <button
    //           onClick={() => router.back()}
    //           className="text-[10px] tracking-widest text-gray-400 uppercase transition-colors hover:text-black"
    //         >
    //           Stay Lost or [ Go Back ]
    //         </button>
    //       </motion.div>

    //       {/* 6. Action Buttons (Brutalist Style) */}
    //       <div className="flex flex-col gap-3">
    //         <button
    //           onClick={() => router.back()}
    //           className="flex items-center justify-center gap-3 border-2 border-black px-6 py-3 text-xs font-bold uppercase transition-colors duration-300 hover:bg-black hover:text-white"
    //         >
    //           <MoveLeft size={14} />
    //           Revert to Previous State
    //         </button>

    //         <button
    //           onClick={() => (window.location.href = "/")}
    //           className="flex items-center justify-center gap-3 bg-black px-6 py-3 text-xs font-bold text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-colors duration-300 hover:bg-gray-800"
    //         >
    //           <RefreshCcw size={14} />
    //           Reset System
    //         </button>
    //       </div>
    //     </div>

    //     {/* Bottom Corner Decor */}
    //     <div className="absolute right-4 bottom-2 text-[10px] text-black/20 italic">
    //       [null_pointer_address_0x004]
    //     </div>
    //   </div>

    //   {/* Background Decorative Crosses */}
    //   {[...Array(4)].map((_, i) => (
    //     <div
    //       key={i}
    //       className={`absolute text-xl font-light text-black/10 ${
    //         i === 0
    //           ? "top-10 left-10"
    //           : i === 1
    //             ? "top-10 right-10"
    //             : i === 2
    //               ? "bottom-10 left-10"
    //               : "right-10 bottom-10"
    //       }`}
    //     >
    //       +
    //     </div>
    //   ))}
    // </div>
    <div className="flex items-center justify-center h-screen">
     <div className="text-center border-2 border-gray-200 p-8 rounded-lg">
       <h1 className="text-4xl font-bold">404</h1>
       <p className="text-lg">Page not found</p>
     </div>
    </div>
  )
}
