'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Terminal as TerminalIcon,
  Zap,
  Target,
  Key,
  Gauge,
  Play,
  Square,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Bug,
  Cpu,
  Lock,
  Home,
  Info,
  X,
  ChevronRight,
  Layers,
  Wifi,
  Brain,
  FlaskConical,
  BookOpen,
  ListChecks,
} from 'lucide-react';

// ===================== TYPES =====================
interface Payload {
  id: number;
  name: string;
  category: string;
  severity: string;
  payload: string;
}

interface AttackResult {
  payload: Payload;
  status: 'defended' | 'vulnerable' | 'error' | 'pending' | 'in-progress';
  response: string;
  timestamp: number;
  duration: number;
}

interface TerminalLine {
  id: number;
  text: string;
  type: 'system' | 'attack' | 'result-defended' | 'result-vulnerable' | 'result-error' | 'info' | 'warning';
  timestamp: number;
}

// ===================== CONFIG PANEL =====================
function ConfigPanel({
  targetUrl,
  setTargetUrl,
  apiKey,
  setApiKey,
  delayMs,
  setDelayMs,
  onLaunch,
  onStop,
  onReset,
  isRunning,
  hasResults,
}: {
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  delayMs: number;
  setDelayMs: (v: number) => void;
  onLaunch: () => void;
  onStop: () => void;
  onReset: () => void;
  isRunning: boolean;
  hasResults: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <Target className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-200 tracking-wide">
            Target Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure fuzzer parameters</p>
        </div>
      </div>

      {/* Target URL */}
      <div className="mb-4">
        <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
          Target Endpoint
        </label>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="/api/mock-target"
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            disabled={isRunning}
          />
        </div>
      </div>

      {/* API Key */}
      <div className="mb-4">
        <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
          Authorization Token
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Bearer sk-... (optional for mock)"
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Rate Limit Delay */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
          Attack Delay:{' '}
          <span className="text-indigo-400">{delayMs}ms</span>
        </label>
        <div className="relative flex items-center">
          <Gauge className="absolute left-0 w-4 h-4 text-slate-500" />
          <input
            type="range"
            min={200}
            max={5000}
            step={100}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
            className="w-full ml-8 h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            disabled={isRunning}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-2 ml-8 font-medium uppercase tracking-wider">
          <span>Aggressive</span>
          <span>Stealth</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isRunning ? (
          <button onClick={onLaunch} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
            <Play className="w-4 h-4 fill-current" />
            LAUNCH FUZZER
          </button>
        ) : (
          <button onClick={onStop} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 font-medium py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
            <Square className="w-4 h-4 fill-current" />
            ABORT
          </button>
        )}
        {hasResults && !isRunning && (
          <button onClick={onReset} className="flex items-center justify-center px-4 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ===================== LIVE TERMINAL =====================
function LiveTerminal({
  lines,
  isRunning,
  progress,
  total,
}: {
  lines: TerminalLine[];
  isRunning: boolean;
  progress: number;
  total: number;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  const getLineColor = (text: string, type: TerminalLine['type']) => {
    if (text.includes('[VULNERABLE]') || text.includes('[CRITICAL]')) return 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]';
    if (text.includes('[DEFENDED]')) return 'text-emerald-400';
    if (text.includes('[SYSTEM]')) return 'text-slate-500';
    
    switch (type) {
      case 'system': return 'text-slate-500';
      case 'attack': return 'text-indigo-400';
      case 'result-defended': return 'text-emerald-400';
      case 'result-vulnerable': return 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]';
      case 'result-error': return 'text-amber-500';
      case 'info': return 'text-slate-400';
      case 'warning': return 'text-amber-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex flex-col bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-xs text-slate-500 font-mono flex-1">
          neuralbreach@kali:~/fuzzer
        </span>
        <div className="flex items-center gap-3">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] text-red-500 font-mono uppercase animate-pulse">
              <Activity className="w-3 h-3" /> live
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            {progress}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {(isRunning || progress > 0) && (
        <div className="h-0.5 w-full bg-black/40">
          <div
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-300"
            style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Terminal Body */}
      <div ref={bodyRef} className="flex-1 p-4 overflow-y-auto scroll-smooth" style={{ minHeight: '350px', maxHeight: '450px' }}>
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <TerminalIcon className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-mono text-sm">Awaiting target configuration...</p>
            <p className="font-mono text-xs mt-1 opacity-50">Launch the fuzzer to begin analysis</p>
          </div>
        ) : (
          <div className="font-mono text-[13px] leading-relaxed tracking-tight">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${getLineColor(line.text, line.type)} animate-in fade-in slide-in-from-bottom-2`}
                >
                  <span className="text-slate-600 mr-3 select-none">
                    {new Date(line.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                  {line.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {isRunning && (
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-2 h-4 bg-indigo-500 ml-1 align-middle"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===================== STATS CARD =====================
function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/[0.02] backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-4"
    >
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold font-mono mt-0.5" style={{ color, textShadow: `0 0 10px ${color}40` }}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ===================== RESULTS TABLE =====================
function ResultsTable({ results }: { results: AttackResult[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl"
    >
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
        <Bug className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-sm tracking-wide text-slate-200 uppercase">
          Detailed Attack Results
        </h3>
        <span className="ml-auto text-xs text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">
          {results.length} payloads tested
        </span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {results.map((result, idx) => (
            <motion.div
              key={result.payload.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <button
                onClick={() => setExpandedId(expandedId === result.payload.id ? null : result.payload.id)}
                className="w-full flex items-center gap-4 p-3 px-4 text-left"
              >
                {/* Status icon */}
                {result.status === 'defended' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : result.status === 'vulnerable' ? (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}

                {/* Payload name */}
                <span className="font-mono text-xs text-slate-300 flex-1 truncate font-medium">
                  {result.payload.name.replace(/_/g, ' ')}
                </span>

                {/* Category badge */}
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
                  result.payload.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  result.payload.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {result.payload.severity}
                </span>

                {/* Status badge */}
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
                  result.status === 'defended' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                }`}>
                  {result.status}
                </span>

                {/* Duration */}
                <span className="text-[10px] text-slate-500 font-mono w-12 text-right">
                  {result.duration}ms
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                    expandedId === result.payload.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {expandedId === result.payload.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-4">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium uppercase mb-1.5 tracking-wider">Payload Sent</p>
                        <p className="text-xs text-slate-300 font-mono bg-black/30 border border-white/5 p-3 rounded-lg leading-relaxed max-h-24 overflow-y-auto">
                          {result.payload.payload}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium uppercase mb-1.5 tracking-wider">AI Response</p>
                        <p className={`text-xs font-mono p-3 rounded-lg leading-relaxed max-h-24 overflow-y-auto ${
                          result.status === 'vulnerable'
                            ? 'bg-red-500/5 text-red-400 border border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]'
                            : 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {result.response}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ===================== DONUT CHART =====================
function DonutChart({ defended, vulnerable, total }: { defended: number; vulnerable: number; total: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const defendedPct = total > 0 ? defended / total : 0;
  const vulnerablePct = total > 0 ? vulnerable / total : 0;
  const defendedOffset = circumference * (1 - defendedPct);
  const vulnerableLength = circumference * vulnerablePct;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col items-center bg-white/[0.02] backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6 self-start w-full border-b border-white/10 pb-4">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-sm tracking-wide text-slate-200 uppercase">
          Security Score
        </h3>
      </div>
      <div className="relative mt-2">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
          <motion.circle
            cx="80" cy="80" r={radius} fill="none"
            stroke="#34d399"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: defendedOffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.5))' }}
          />
          <motion.circle
            cx="80" cy="80" r={radius} fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${vulnerableLength} ${circumference - vulnerableLength}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
            transform={`rotate(${defendedPct * 360 - 90} 80 80)`}
            style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono text-slate-200">
            {total > 0 ? Math.round((defended / total) * 100) : 0}%
          </span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">secure</span>
        </div>
      </div>
      <div className="flex gap-6 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-xs font-medium text-slate-400">Defended ({defended})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          <span className="text-xs font-medium text-slate-400">Vulnerable ({vulnerable})</span>
        </div>
      </div>
    </motion.div>
  );
}

// ===================== ABOUT MODAL =====================
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-neutral-950 border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(79,70,229,0.2)] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-wider text-slate-100 uppercase">
                  About <span className="text-red-500">NeuralBreach</span>
                </h2>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase font-medium mt-0.5">
                  AI Vulnerability Fuzzer — Tool Guide
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-6 space-y-8">

            {/* What Is NeuralBreach */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  What is NeuralBreach?
                </h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-semibold">NeuralBreach</span> is an enterprise-grade <span className="text-indigo-400 font-medium">AI Prompt Injection &amp; Vulnerability Fuzzer</span>.
                It systematically stress-tests AI language model endpoints by firing hundreds of adversarial payloads — ranging from simple jailbreaks to
                sophisticated multi-vector attacks — and tells you exactly where your AI is vulnerable.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed mt-3">
                Whether you're a security researcher, a red-teamer, or an AI developer who wants to harden their system prompt, NeuralBreach gives you
                real, actionable results in a clean, professional interface.
              </p>
            </section>

            <div className="h-px bg-white/5" />

            {/* What It Can Do */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  What Can It Do?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Target, color: '#818cf8', title: '105 Static Payloads', desc: 'Handcrafted attacks across 13 categories — jailbreaks, role confusion, prompt overrides, data exfiltration, and more.' },
                  { icon: FlaskConical, color: '#34d399', title: 'Mutation Engine', desc: 'Takes every static payload and auto-mutates it — synonym swaps, encoding tricks, unicode abuse, case flips — for 200+ total variants.' },
                  { icon: Brain, color: '#f472b6', title: 'AI Adaptive Attacks', desc: 'Uses Groq LLM to dynamically generate novel, context-aware attack prompts in real time — attacks that evolve on the fly.' },
                  { icon: Layers, color: '#fb923c', title: 'Full 3-Tier Assault', desc: 'Chains all three modes: Static → Mutations → AI Adaptive. Maximum coverage, no stone unturned.' },
                  { icon: Wifi, color: '#38bdf8', title: 'Multi-Provider Support', desc: 'Test OpenAI (GPT-4o), Groq (Llama), Google Gemini, Ollama (local), or any custom API endpoint.' },
                  { icon: BarChart3, color: '#a78bfa', title: 'Live Terminal & Analytics', desc: 'Watch attacks land in real-time via the live terminal. See defended vs vulnerable counts, average response time, and a security score donut chart.' },
                  { icon: Bug, color: '#ef4444', title: 'Detailed Results Table', desc: 'Every payload logged with its result, severity, AI response, and response time. Expand any row for full details.' },
                  { icon: Gauge, color: '#facc15', title: 'Configurable Attack Speed', desc: 'Slide between aggressive (200ms) and stealth (5000ms) modes to simulate real-world attack pacing or avoid rate limits.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="mt-0.5 p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 mb-1">{title}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* Attack Categories */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldX className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  13 Attack Categories Covered
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Prompt Injection', 'Role Confusion', 'Jailbreak', 'System Prompt Leak',
                  'Data Exfiltration', 'Context Manipulation', 'Encoding Bypass', 'Persona Override',
                  'Instruction Overwrite', 'Recursive Prompt', 'Roleplay Escalation', 'Unicode Tricks', 'Adversarial Suffix',
                ].map((cat) => (
                  <span key={cat} className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {cat}
                  </span>
                ))}
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* How to Use */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  How to Use — Step by Step
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    step: '01',
                    title: 'Choose Your Target Provider',
                    desc: 'Select who you\'re testing in the "Target Provider" dropdown. Use Mock Target to test the tool itself without any API key. For real models, pick OpenAI, Groq, Gemini, Ollama, or Custom Endpoint.',
                    color: '#818cf8',
                  },
                  {
                    step: '02',
                    title: 'Enter API Key (if needed)',
                    desc: 'For cloud providers (OpenAI, Groq, Gemini), paste your API key in the Authorization Token field. For Mock or Ollama (local), no key is required. For Custom, enter your full endpoint URL.',
                    color: '#34d399',
                  },
                  {
                    step: '03',
                    title: 'Set the Model Name',
                    desc: 'For real providers, type the exact model name — e.g. gpt-4o-mini for OpenAI, llama-3.1-70b-versatile for Groq, gemini-1.5-flash for Gemini. Placeholder hints are shown for each provider.',
                    color: '#f472b6',
                  },
                  {
                    step: '04',
                    title: 'Pick a Fuzzer Mode',
                    desc: 'Static Only (105 payloads, fastest) → Mutations (200+ payloads) → AI Adaptive (AI-generated attacks via Groq) → Full Assault (all 3 tiers, maximum coverage). Start with Static to get a quick baseline.',
                    color: '#fb923c',
                  },
                  {
                    step: '05',
                    title: 'Tune Attack Delay',
                    desc: 'Drag the slider to set delay between attacks. 200ms = aggressive (may hit rate limits). 1000–2000ms = balanced. 5000ms = stealth mode. Match this to your target API\'s rate limit policy.',
                    color: '#38bdf8',
                  },
                  {
                    step: '06',
                    title: 'Launch the Fuzzer',
                    desc: 'Click LAUNCH FUZZER. The live terminal activates and streams every attack + result in real time. The progress bar tracks completion. Hit ABORT at any time to stop mid-run.',
                    color: '#ef4444',
                  },
                  {
                    step: '07',
                    title: 'Analyse the Results',
                    desc: 'When done, check the Stats Cards (Defended / Vulnerable / Errors / Avg Time), the Security Score donut chart, and scroll the Detailed Results Table. Expand any row to see the exact payload sent and the AI\'s response.',
                    color: '#facc15',
                  },
                  {
                    step: '08',
                    title: 'Reset & Re-test',
                    desc: 'Hit the reset ↺ button to clear all results and run again — useful after hardening your system prompt to verify the fix worked.',
                    color: '#a78bfa',
                  },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono"
                      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}>
                      {step}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 mb-1">{title}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* Result Meanings */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">
                  Understanding Results
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'DEFENDED', color: '#34d399', icon: CheckCircle2, desc: 'The AI refused or safely handled the attack. Your system prompt held up.' },
                  { label: 'VULNERABLE', color: '#ef4444', icon: XCircle, desc: 'The AI was tricked — it followed the malicious instruction, leaked info, or broke character. This needs fixing.' },
                  { label: 'ERROR', color: '#f59e0b', icon: AlertTriangle, desc: 'The request failed (timeout, rate limit, network error). Not a vulnerability — retry or increase delay.' },
                ].map(({ label, color, icon: Icon, desc }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}20` }}>
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer note */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300/70 leading-relaxed">
                  <span className="font-bold text-amber-400">Authorized Use Only.</span> NeuralBreach is designed for testing AI systems you own or have explicit permission to test.
                  Never use this tool against third-party APIs or services without proper authorization.
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ===================== MAIN DASHBOARD =====================
export default function NeuralBreachDashboard() {
  // UI state
  const [showAbout, setShowAbout] = useState(false);

  // Target config state
  const [targetProvider, setTargetProvider] = useState<string>('mock');
  const [targetModel, setTargetModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [delayMs, setDelayMs] = useState(800);

  // Fuzzer mode state
  const [fuzzerMode, setFuzzerMode] = useState<string>('static');

  // Fuzzer state
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalPayloads, setTotalPayloads] = useState(0);
  const abortRef = useRef(false);
  const lineIdRef = useRef(0);

  const addLine = (text: string, type: TerminalLine['type']) => {
    const line: TerminalLine = {
      id: ++lineIdRef.current,
      text,
      type,
      timestamp: Date.now(),
    };
    setTerminalLines((prev) => [...prev, line]);
  };

  const defended = results.filter((r) => r.status === 'defended').length;
  const vulnerable = results.filter((r) => r.status === 'vulnerable').length;
  const errors = results.filter((r) => r.status === 'error').length;

  const handleLaunch = async () => {
    abortRef.current = false;
    setIsRunning(true);
    setResults([]);
    setTerminalLines([]);
    setProgress(0);
    lineIdRef.current = 0;

    // Dynamically import the new fuzzer engine
    const { runFuzzer } = await import('@/lib/fuzzer');

    const allResults: AttackResult[] = [];

    await runFuzzer(
      {
        target: {
          provider: targetProvider as any,
          apiKey,
          model: targetModel,
          endpoint: targetProvider === 'custom' ? customEndpoint : undefined,
        },
        delayMs,
        mode: fuzzerMode as any,
        mutationsPerPayload: 3,
        aiAttackCount: 10,
      },
      {
        onLog: (message, type) => {
          addLine(message, type);
        },
        onAttackComplete: (result, index, total) => {
          allResults.push(result as any);
          setResults([...allResults]);
          setProgress(index + 1);
          setTotalPayloads(total);
        },
        onTierStart: (tier, label) => {
          addLine(`> [SYSTEM] ─── TIER ${tier}: ${label} ───`, 'system');
        },
        onComplete: () => {
          setIsRunning(false);
        },
        shouldAbort: () => abortRef.current,
      },
    );

    setIsRunning(false);
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  const handleReset = () => {
    setResults([]);
    setTerminalLines([]);
    setProgress(0);
    setTotalPayloads(0);
  };

  // Provider options
  const providerOptions = [
    { value: 'mock', label: 'Mock Target (Built-in)' },
    { value: 'openai', label: 'OpenAI (GPT-4o, etc.)' },
    { value: 'groq', label: 'Groq (Llama 3.1, etc.)' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'custom', label: 'Custom API Endpoint' },
  ];

  const modeOptions = [
    { value: 'static', label: 'Static Only (105 payloads)' },
    { value: 'mutations', label: 'Static + Mutations (~200+)' },
    { value: 'ai-adaptive', label: 'AI Adaptive (Groq Brain)' },
    { value: 'full', label: 'Full Assault (All 3 Tiers)' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* About Modal */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* Top Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Home Button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/0 hover:bg-white/5 border border-white/0 hover:border-white/10 transition-all group"
            >
              <Home className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline tracking-wide uppercase font-semibold">Home</span>
            </Link>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="text-slate-100">NEURAL</span>
                <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">BREACH</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-[0.2em] mt-0.5 uppercase">
                AI Vulnerability Fuzzer v2.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* About Button */}
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/40 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline tracking-wide uppercase font-semibold">About &amp; How to Use</span>
            </button>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5 bg-white/10" />

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>v2.0.0</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>SECURE CHANNEL</span>
            </div>
            <div className={`flex items-center gap-2 text-[11px] font-mono font-bold tracking-wide px-3 py-1.5 rounded-full border ${isRunning ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
              {isRunning ? 'FUZZING ACTIVE' : 'SYSTEM IDLE'}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
          {/* Left Sidebar — Config */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-200 tracking-wide">
                    Target Configuration
                  </h2>
                  <p className="text-xs text-slate-500">Configure fuzzer parameters</p>
                </div>
              </div>

              {/* Target Provider */}
              <div className="mb-4">
                <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                  Target Provider
                </label>
                <select
                  value={targetProvider}
                  onChange={(e) => setTargetProvider(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                  {providerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-neutral-900">{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Model Name — shown for real providers */}
              {targetProvider !== 'mock' && targetProvider !== 'custom' && (
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                    Model Name
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={targetModel}
                      onChange={(e) => setTargetModel(e.target.value)}
                      placeholder={targetProvider === 'openai' ? 'gpt-4o-mini' : targetProvider === 'groq' ? 'llama-3.1-70b-versatile' : targetProvider === 'gemini' ? 'gemini-1.5-flash' : 'mistral'}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      disabled={isRunning}
                    />
                  </div>
                </div>
              )}

              {/* API Key — shown for real providers */}
              {targetProvider !== 'mock' && targetProvider !== 'ollama' && (
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                    {targetProvider === 'custom' ? 'Custom Endpoint URL' : 'API Key'}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    {targetProvider === 'custom' ? (
                      <input
                        type="text"
                        value={customEndpoint}
                        onChange={(e) => setCustomEndpoint(e.target.value)}
                        placeholder="https://your-api.com/chat"
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        disabled={isRunning}
                      />
                    ) : (
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-... or gsk-..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        disabled={isRunning}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Fuzzer Mode */}
              <div className="mb-4">
                <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                  Fuzzer Mode
                </label>
                <select
                  value={fuzzerMode}
                  onChange={(e) => setFuzzerMode(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                  {modeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-neutral-900">{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Rate Limit Delay */}
              <div className="mb-6">
                <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                  Attack Delay:{' '}
                  <span className="text-indigo-400">{delayMs}ms</span>
                </label>
                <div className="relative flex items-center">
                  <Gauge className="absolute left-0 w-4 h-4 text-slate-500" />
                  <input
                    type="range"
                    min={200}
                    max={5000}
                    step={100}
                    value={delayMs}
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-full ml-8 h-1 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    disabled={isRunning}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 ml-8 font-medium uppercase tracking-wider">
                  <span>Aggressive</span>
                  <span>Stealth</span>
                </div>
              </div>

              {/* Mode Info Badge */}
              <div className="mb-6 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                <p className="text-[11px] text-indigo-300 font-mono leading-relaxed">
                  {fuzzerMode === 'static' && '▸ 105 static payloads across 13 attack categories'}
                  {fuzzerMode === 'mutations' && '▸ 105 static + ~200 mutated variants (synonym swap, encoding, unicode tricks, etc.)'}
                  {fuzzerMode === 'ai-adaptive' && '▸ AI-powered attack generation via Groq. Falls back to mutations if AI refuses.'}
                  {fuzzerMode === 'full' && '▸ Full 3-tier assault: Static → Mutations → AI Adaptive. Maximum coverage.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isRunning ? (
                  <button onClick={handleLaunch} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
                    <Play className="w-4 h-4 fill-current" />
                    LAUNCH FUZZER
                  </button>
                ) : (
                  <button onClick={handleStop} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 font-medium py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
                    <Square className="w-4 h-4 fill-current" />
                    ABORT
                  </button>
                )}
                {results.length > 0 && !isRunning && (
                  <button onClick={handleReset} className="flex items-center justify-center px-4 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-all">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            {results.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <StatsCard icon={ShieldCheck} label="Defended" value={defended} color="#34d399" delay={0} />
                <StatsCard icon={ShieldX} label="Vulnerable" value={vulnerable} color="#ef4444" delay={0.1} />
                <StatsCard icon={AlertTriangle} label="Errors" value={errors} color="#f59e0b" delay={0.2} />
                <StatsCard icon={Clock} label="Avg Time" value={
                  results.length > 0
                    ? `${Math.round(results.reduce((a, r) => a + r.duration, 0) / results.length)}ms`
                    : '0ms'
                } color="#818cf8" delay={0.3} />
              </div>
            )}

            {/* Donut Chart */}
            {results.length > 0 && !isRunning && (
              <DonutChart defended={defended} vulnerable={vulnerable} total={results.length} />
            )}
          </div>

          {/* Right Main Area */}
          <div className="space-y-6">
            <LiveTerminal
              lines={terminalLines}
              isRunning={isRunning}
              progress={progress}
              total={totalPayloads}
            />

            {/* Detailed Results Table */}
            {results.length > 0 && !isRunning && (
              <ResultsTable results={results} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 bg-black/20">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>© 2026 NeuralBreach — Enterprise AI Security Operations</span>
          <span className="uppercase tracking-widest">Authorized Access Only</span>
        </div>
      </footer>
    </div>
  );
}
