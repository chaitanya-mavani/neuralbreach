'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronLeft, 
  User, 
  Briefcase, 
  ShieldCheck, 
  Terminal,
  Cpu,
  Network
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-mono flex flex-col relative overflow-hidden">
      {/* Background grids / effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#E11D48]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[#8B5CF6]/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#1E293B] bg-[#0F172A]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors bg-[#0B1120] px-3 py-1.5 rounded border border-[#1E293B] text-[10px] font-bold uppercase tracking-wider">
              <ChevronLeft className="w-3.5 h-3.5" />
              BACK TO SOC
            </button>
          </Link>
          <div className="h-6 w-px bg-[#1E293B]"></div>
          <h1 className="text-xl font-bold tracking-wider leading-none text-slate-100">
            <span>NEURAL</span>
            <span className="text-[#E11D48] ml-1">BREACH</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-100 tracking-widest uppercase mb-2">System Intel</h2>
          <p className="text-slate-400 text-sm tracking-wide">CONFIDENTIAL CLEARANCE // PROJECT BRIEFING</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Creator Profile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#0F172A]/60 border border-[#1E293B] p-6 rounded-xl shadow-2xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1E293B]">
              <User className="w-5 h-5 text-[#E11D48]" />
              <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest">Creator Profile</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Name</span>
                <span className="text-slate-200 font-semibold text-base">Chaitanya Mavani</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Age</span>
                <span className="text-slate-200 font-semibold text-base">17</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Project CodeName</span>
                <span className="text-[#E11D48] font-bold text-base tracking-wider">NEURAL BREACH</span>
              </div>
              <div className="flex flex-col pt-2 border-t border-[#1E293B]/50">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Context</span>
                <div className="flex items-center gap-2 mt-1 bg-[#1E293B]/30 px-3 py-2 rounded">
                  <Briefcase className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-slate-300 font-semibold">GTU 2-Week IBM Internship Project</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Project Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#0F172A]/60 border border-[#1E293B] p-6 rounded-xl shadow-2xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1E293B]">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest">Project Brief</h3>
            </div>
            
            <div className="space-y-5 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="text-slate-100">Neural Breach</strong> is an elite, high-speed LLM Fuzzer and Live AI Threat Map. It is engineered to rigorously test large language models (like GPT-4, Claude, and Gemini) for security vulnerabilities.
              </p>
              
              <div className="bg-[#1E293B]/20 p-4 rounded border border-[#1E293B]/50 flex gap-3">
                <Terminal className="w-5 h-5 text-[#E11D48] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-slate-200 font-bold mb-1 text-[11px] uppercase tracking-wider">How it works</h4>
                  <p className="text-xs">
                    The system continuously bombards target AI infrastructure globally with automated jailbreak prompts, logical fallacies, adversarial payloads, and context-window overload attacks. It maps these incursions on a visual dashboard to simulate global SOC operations.
                  </p>
                </div>
              </div>

              <div className="bg-[#1E293B]/20 p-4 rounded border border-[#1E293B]/50 flex gap-3">
                <Cpu className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-slate-200 font-bold mb-1 text-[11px] uppercase tracking-wider">Why it's useful</h4>
                  <p className="text-xs">
                    As AI models scale and integrate into critical pipelines, they become targets for prompt injection, sensitive data extraction, and roleplay hijacking. Neural Breach provides cyber teams with visual oversight to identify weaknesses before malicious actors exploit them in production environments.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* Animated Footer graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 border border-[#1E293B] rounded-xl p-4 bg-[#0F172A]/40 flex items-center justify-center gap-6"
        >
          <Network className="w-6 h-6 text-slate-500 animate-pulse" />
          <div className="h-px bg-gradient-to-r from-transparent via-[#1E293B] to-transparent flex-1"></div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure The Future of AI</span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#1E293B] to-transparent flex-1"></div>
          <ShieldCheck className="w-6 h-6 text-slate-500 animate-pulse" />
        </motion.div>

      </main>
    </div>
  );
}
