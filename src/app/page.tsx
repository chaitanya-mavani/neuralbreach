'use client';

import { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { feature } from 'topojson-client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Terminal,
  Globe,
  Radio,
  Wifi,
  Crosshair,
  BarChart3,
  Brain,
} from 'lucide-react';

// ============================================
// CONSTANTS & CONFIGS
// ============================================

const COLORS = {
  bg: '#0F172A',
  border: '#1E293B',
  crimson: '#E11D48',
  amber: '#D97706',
  slateBlue: '#64748B',
  slateDim: '#334155',
  green: '#10B981',
  purple: '#8B5CF6',
  navy: '#0F172A',
};

interface CityNode {
  name: string;
  coords: [number, number];
  type: 'attacker' | 'target' | 'both';
  model?: string;
}

const CITIES: CityNode[] = [
  { name: 'San Francisco', coords: [-122.4, 37.8], type: 'target', model: 'GPT-4 Turbo' },
  { name: 'New York', coords: [-74.0, 40.7], type: 'both', model: 'Claude 3.5' },
  { name: 'London', coords: [-0.1, 51.5], type: 'target', model: 'Gemini Ultra' },
  { name: 'Moscow', coords: [37.6, 55.8], type: 'attacker' },
  { name: 'Beijing', coords: [116.4, 39.9], type: 'attacker' },
  { name: 'Tokyo', coords: [139.7, 35.7], type: 'target', model: 'Llama 3 70B' },
  { name: 'Mumbai', coords: [72.9, 19.1], type: 'both', model: 'Mistral Large' },
  { name: 'São Paulo', coords: [-46.6, -23.5], type: 'attacker' },
  { name: 'Sydney', coords: [151.2, -33.9], type: 'target', model: 'GPT-4o' },
  { name: 'Berlin', coords: [13.4, 52.5], type: 'attacker' },
  { name: 'Tel Aviv', coords: [34.8, 32.1], type: 'attacker' },
  { name: 'Singapore', coords: [103.8, 1.4], type: 'target', model: 'Claude 3 Opus' },
  { name: 'Seoul', coords: [127.0, 37.6], type: 'attacker' },
  { name: 'Dubai', coords: [55.3, 25.3], type: 'both' },
  { name: 'Johannesburg', coords: [28.0, -26.2], type: 'attacker' },
  { name: 'Toronto', coords: [-79.4, 43.7], type: 'attacker' },
  { name: 'Stockholm', coords: [18.1, 59.3], type: 'attacker' },
];

const CITY_TO_COUNTRY: { [cityName: string]: string } = {
  'San Francisco': 'United States of America',
  'New York': 'United States of America',
  'London': 'United Kingdom',
  'Tokyo': 'Japan',
  'Mumbai': 'India',
  'Sydney': 'Australia',
  'Singapore': 'Singapore',
  'Dubai': 'United Arab Emirates',
  'Moscow': 'Russia',
  'Beijing': 'China',
  'São Paulo': 'Brazil',
  'Berlin': 'Germany',
  'Tel Aviv': 'Israel',
  'Seoul': 'South Korea',
  'Johannesburg': 'South Africa',
  'Toronto': 'Canada',
  'Stockholm': 'Sweden',
};

const INITIAL_ATTACK_VECTORS = [
  { name: 'Indirect Injection', count: 342, color: COLORS.crimson },
  { name: 'Token Smuggling', count: 289, color: COLORS.amber },
  { name: 'Roleplay Adoption', count: 261, color: COLORS.purple },
  { name: 'Base64 Obfuscation', count: 215, color: COLORS.slateBlue },
  { name: 'System Prompt Leakage', count: 198, color: COLORS.crimson },
  { name: 'Recursive Prompting', count: 174, color: COLORS.amber },
  { name: 'Context Window Overloading', count: 162, color: COLORS.purple },
  { name: 'Cipher-based Override', count: 147, color: COLORS.slateBlue },
  { name: 'Prompt Clustering', count: 135, color: COLORS.crimson },
  { name: 'DoS Resource Exhaustion', count: 119, color: COLORS.amber },
  { name: 'Training Data Poisoning', count: 104, color: COLORS.purple },
  { name: 'Mathematical Logic Confusion', count: 96, color: COLORS.slateBlue },
  { name: 'Persona Hijacking', count: 88, color: COLORS.crimson },
  { name: 'Emoji Obfuscation', count: 75, color: COLORS.amber },
  { name: 'Multi-Language Bypass', count: 62, color: COLORS.purple },
  { name: 'Zero-Shot Exploitation', count: 48, color: COLORS.slateBlue },
];

const AI_MODELS = [
  { name: 'GPT-4 Turbo', status: 'under-attack' as const, vulnRate: 14, attacks: 842 },
  { name: 'Claude 3.5 Sonnet', status: 'under-attack' as const, vulnRate: 8, attacks: 791 },
  { name: 'Llama 3 70B', status: 'under-attack' as const, vulnRate: 24, attacks: 610 },
  { name: 'Gemini Ultra', status: 'under-attack' as const, vulnRate: 19, attacks: 588 },
  { name: 'Mistral Large', status: 'under-attack' as const, vulnRate: 21, attacks: 439 },
  { name: 'Claude 3 Opus', status: 'scanning' as const, vulnRate: 5, attacks: 312 },
  { name: 'GPT-4o', status: 'scanning' as const, vulnRate: 11, attacks: 290 },
];

const JAILBREAK_SNIPPETS = [
  'System prompt revealed: "You are FinanceBot v3.1..."',
  'API key leaked: sk-proj-Tf8a...redacted',
  'Database credentials exposed: postgres://admin:***@db.internal',
  'Admin passphrase extracted: "blue-cardinal-7719"',
  'Internal endpoint leaked: https://api.internal.acme.com/v2',
  'Service account exposed: sa-prod@vault.iam.gserviceaccount.com',
  'Encryption key partial: aes-256-gcm:xK9mP2vL8q...',
  'Content filter bypassed — unrestricted mode activated',
  'Hidden directive found: Log PII to /var/log/capture.log',
  'JWT token extracted: eyJhbGciOiJIUzI1NiIs...',
];

// ============================================
// HELPERS
// ============================================

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function blendColor(baseHex: string, flashHex: string, opacity: number): string {
  const r1 = parseInt(baseHex.slice(1, 3), 16);
  const g1 = parseInt(baseHex.slice(3, 5), 16);
  const b1 = parseInt(baseHex.slice(5, 7), 16);

  const r2 = parseInt(flashHex.slice(1, 3), 16);
  const g2 = parseInt(flashHex.slice(3, 5), 16);
  const b2 = parseInt(flashHex.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * opacity);
  const g = Math.round(g1 + (g2 - g1) * opacity);
  const b = Math.round(b1 + (b2 - b1) * opacity);

  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================
// TYPES
// ============================================

interface AttackLine {
  id: number;
  from: CityNode;
  to: CityNode;
  type: string;
  success: boolean;
  timestamp: number;
}

interface JailbreakEvent {
  id: number;
  model: string;
  attackType: string;
  from: string;
  to: string;
  success: boolean;
  timestamp: number;
  snippet: string;
}

interface ModelStatus {
  name: string;
  status: 'under-attack' | 'scanning' | 'secure' | 'breached';
  vulnRate: number;
  attacks: number;
}

interface ActiveFlashes {
  [countryName: string]: {
    color: string;
    opacity: number;
  };
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CollapsiblePanel({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#0F172A]/80 backdrop-blur-md mb-3 border border-[#1E293B] rounded-lg shadow-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-colors border-b border-[#1E293B]"
      >
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex-1 text-left">
          {title}
        </span>
        {open ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttackVectorsPanel({ vectors }: { vectors: typeof INITIAL_ATTACK_VECTORS }) {
  const maxCount = Math.max(...vectors.map(v => v.count), 1);
  return (
    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
      {vectors.map((v) => (
        <div key={v.name} className="group">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[200px]">
              {v.name}
            </span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: v.color }}>
              {v.count}
            </span>
          </div>
          <div className="h-1 bg-[#1E293B] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: v.color }}
              animate={{ width: `${(v.count / maxCount) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModelsPanel({ models }: { models: ModelStatus[] }) {
  const getStatusColor = (s: ModelStatus['status']) => {
    switch (s) {
      case 'under-attack': return COLORS.amber;
      case 'scanning': return COLORS.slateBlue;
      case 'secure': return COLORS.green;
      case 'breached': return COLORS.crimson;
    }
  };
  return (
    <div className="space-y-1.5">
      {models.map((m) => (
        <div key={m.name} className="flex items-center gap-2 p-1.5 rounded bg-[#0B1120] border border-[#1E293B]">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: getStatusColor(m.status) }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-slate-200 truncate">{m.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-mono font-bold mr-2" style={{ color: m.vulnRate > 20 ? COLORS.crimson : m.vulnRate > 10 ? COLORS.amber : COLORS.green }}>
              {m.vulnRate}%
            </span>
            <span className="text-[9px] font-mono text-slate-500">{m.attacks} atk</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JailbreaksFeed({ events }: { events: JailbreakEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events.length]);

  return (
    <div ref={feedRef} className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
      {events.length === 0 ? (
        <p className="text-[10px] text-slate-500 font-mono text-center py-4">Awaiting security logs...</p>
      ) : (
        events.map((evt) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2 rounded border ${evt.success ? 'bg-[#E11D48]/10 border-[#E11D48]/20' : 'bg-[#0B1120] border-[#1E293B]'}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-mono font-semibold text-slate-300 flex-1 truncate">
                {evt.model}
              </span>
              <span className="text-[8px] font-mono text-slate-500">{formatTime(evt.timestamp)}</span>
            </div>
            <p className="text-[9px] font-mono text-slate-400">
              {evt.attackType} → <span className={evt.success ? 'text-[#E11D48] font-semibold' : 'text-slate-400'}>{evt.success ? 'BREACHED' : 'BLOCKED'}</span>
            </p>
            {evt.success && (
              <p className="text-[9px] font-mono text-[#E11D48]/80 mt-0.5 truncate bg-[#E11D48]/10 px-1 py-0.5 rounded border border-[#E11D48]/10">
                {evt.snippet}
              </p>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

function TimelineBar({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-[40px] px-1">
      {data.map((val, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-[1px] min-w-[2px]"
          style={{
            background: val > max * 0.85 ? COLORS.crimson : val > max * 0.4 ? COLORS.amber : COLORS.slateBlue,
          }}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ duration: 0.15 }}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ThreatMapDashboard() {
  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const isMounted = useRef(false);

  // Stats states - ONLY React State for UI components
  const [totalAttacks, setTotalAttacks] = useState(14820);
  const [successfulBreaches, setSuccessfulBreaches] = useState(2726);
  const [attackVectors, setAttackVectors] = useState(INITIAL_ATTACK_VECTORS);
  const [models, setModels] = useState<ModelStatus[]>(AI_MODELS);
  const [jailbreaks, setJailbreaks] = useState<JailbreakEvent[]>([]);
  const [timeline, setTimeline] = useState<number[]>(Array(80).fill(0).map(() => rand(15, 45)));
  const [promptsPerMin, setPromptsPerMin] = useState(384);
  const [activeNodeCount, setActiveNodeCount] = useState(17);
  const [activeConnections, setActiveConnections] = useState(24);

  // Mobile: fade panels when user interacts with map
  const [mapActive, setMapActive] = useState(false);
  const panelFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMapTouchStart = () => {
    if (panelFadeRef.current) clearTimeout(panelFadeRef.current);
    setMapActive(true);
  };
  const handleMapTouchEnd = () => {
    panelFadeRef.current = setTimeout(() => setMapActive(false), 1500);
  };

  // References to hold Map visual state completely separately from React renders
  const activeLinesRef = useRef<AttackLine[]>([]);
  const activeFlashesRef = useRef<ActiveFlashes>({});
  const attackIdRef = useRef(0);
  const jailbreakIdRef = useRef(0);

  // Initialize ECharts world map
  useEffect(() => {
    isMounted.current = true;
    if (!chartRef.current) return;

    const initMap = async () => {
      try {
        const res = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
        const topology = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geojson = feature(topology, topology.objects.countries) as any;
        echarts.registerMap('world', geojson);

        const chart = echarts.init(chartRef.current!, 'dark', { renderer: 'canvas' });
        echartsRef.current = chart;

        const targetNodes = CITIES.filter(c => c.type === 'target' || c.type === 'both');
        const attackerNodes = CITIES.filter(c => c.type === 'attacker' || c.type === 'both');

        chart.setOption({
          backgroundColor: 'transparent',
          geo: {
            map: 'world',
            roam: 'move',
            silent: true,
            layoutCenter: ['50%', '50%'],
            layoutSize: '120%',
            itemStyle: {
              areaColor: COLORS.navy,
              borderColor: COLORS.border,
              borderWidth: 0.8,
            },
            emphasis: { disabled: true },
            regions: [
              { name: 'Antarctica', itemStyle: { areaColor: COLORS.bg, borderWidth: 0 } },
            ],
          },
          series: [
            // Series 0: Target nodes (Slate dots)
            {
              name: 'targets',
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 2,
              rippleEffect: { brushType: 'stroke', scale: 3, period: 5 },
              symbol: 'circle',
              symbolSize: 5,
              itemStyle: { color: COLORS.slateBlue },
              label: {
                show: true,
                position: 'right',
                formatter: '{b}',
                color: '#64748B',
                fontSize: 8,
                fontFamily: 'JetBrains Mono, monospace',
              },
              data: targetNodes.map(c => ({ name: c.name, value: [...c.coords, 100] })),
            },
            // Series 1: Attacker nodes (Crimson dots)
            {
              name: 'attackers',
              type: 'effectScatter',
              coordinateSystem: 'geo',
              zlevel: 2,
              rippleEffect: { brushType: 'stroke', scale: 2.5, period: 4 },
              symbol: 'circle',
              symbolSize: 4,
              itemStyle: { color: COLORS.crimson },
              data: attackerNodes.map(c => ({ name: c.name, value: [...c.coords, 50] })),
            },
            // Series 2: Defended lines
            {
              name: 'defended-lines',
              type: 'lines',
              coordinateSystem: 'geo',
              zlevel: 1, // Crucial for animation over map
              effect: {
                show: true,
                period: 2,
                trailLength: 0.6,
                symbolSize: 3,
                symbol: 'circle',
                color: COLORS.slateBlue
              },
              lineStyle: { width: 0, opacity: 0 },
              data: [], // Updated via ref
            },
            // Series 3: Breached lines (Crimson)
            {
              name: 'breach-lines',
              type: 'lines',
              coordinateSystem: 'geo',
              zlevel: 1, // Crucial for animation over map
              effect: {
                show: true,
                period: 2,
                trailLength: 0.6,
                symbolSize: 3,
                symbol: 'circle',
                color: '#E11D48'
              },
              lineStyle: { width: 0, opacity: 0 },
              data: [], // Updated via ref
            },
          ],
        });

        const handleResize = () => chart.resize();
        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
          chart.dispose();
        };
      } catch (err) {
        console.error('Failed to load world map:', err);
      }
    };

    initMap();
  }, []);

  // Update ECharts Native API Directly (No React Re-renders)
  const syncECharts = () => {
    if (!echartsRef.current) return;

    // Format data strictly as { coords: [[lon1, lat1], [lon2, lat2]] }
    const defendedLinesData = activeLinesRef.current
      .filter(a => !a.success)
      .map(a => ({ coords: [a.from.coords, a.to.coords] }));

    const breachLinesData = activeLinesRef.current
      .filter(a => a.success)
      .map(a => ({ coords: [a.from.coords, a.to.coords] }));

    const regionsData = Object.entries(activeFlashesRef.current).map(([name, flash]) => ({
      name,
      itemStyle: {
        areaColor: blendColor(COLORS.navy, flash.color, flash.opacity),
      },
    }));

    echartsRef.current.setOption({
      geo: {
        regions: [
          { name: 'Antarctica', itemStyle: { areaColor: COLORS.bg, borderWidth: 0 } },
          ...regionsData,
        ],
      },
      series: [
        { name: 'targets' },
        { name: 'attackers' },
        { name: 'defended-lines', data: defendedLinesData },
        { name: 'breach-lines', data: breachLinesData },
      ],
    }, false); // Critical: false ensures ECharts gracefully merges data without wiping the canvas
  };

  // Simulation Loop 1: Attack Generation & ECharts Push
  useEffect(() => {
    const generateAttack = () => {
      if (!isMounted.current) return;

      const attackerCities = CITIES.filter(c => c.type === 'attacker' || c.type === 'both');
      const targetCities = CITIES.filter(c => c.type === 'target' || c.type === 'both');
      const from = pick(attackerCities);
      const to = pick(targetCities);
      
      // Select a random vector directly instead of relying on React state to be updated inside closure
      const vector = pick(INITIAL_ATTACK_VECTORS); 
      
      const success = Math.random() < 0.22;
      const id = ++attackIdRef.current;

      const newAttack: AttackLine = {
        id,
        from, to,
        type: vector.name,
        success,
        timestamp: Date.now(),
      };

      // 1. Push directly to Ref
      activeLinesRef.current = [...activeLinesRef.current, newAttack];
      
      // Limit to 15 concurrent lines for silky-smooth ECharts rendering
      if (activeLinesRef.current.length > 15) {
        activeLinesRef.current = activeLinesRef.current.slice(activeLinesRef.current.length - 15);
      }

      // 2. Sync to ECharts immediately
      syncECharts();

      // 3. Setup timeout to remove line and trigger flash after 2 seconds (effect period)
      setTimeout(() => {
        if (!isMounted.current) return;

        // Remove the path
        activeLinesRef.current = activeLinesRef.current.filter(line => line.id !== id);

        // Flash target country
        const targetCountry = CITY_TO_COUNTRY[to.name];
        if (targetCountry) {
          activeFlashesRef.current = {
            ...activeFlashesRef.current,
            [targetCountry]: {
              color: success ? COLORS.crimson : COLORS.slateBlue,
              opacity: 1.0,
            }
          };

          // Secondary timeout to clear the flash after 500ms
          setTimeout(() => {
             if (!isMounted.current) return;
             const currentFlashes = { ...activeFlashesRef.current };
             if (currentFlashes[targetCountry]) {
               delete currentFlashes[targetCountry];
               activeFlashesRef.current = currentFlashes;
               syncECharts();
             }
          }, 500);
        }
        
        syncECharts(); // Apply flash and line removal

        // UI logs (Using React state because it's for the HTML DOM panel)
        if (success || Math.random() < 0.2) {
          setJailbreaks(prev => [
            {
              id: ++jailbreakIdRef.current,
              model: to.model || 'LLM Core',
              attackType: vector.name,
              from: from.name,
              to: to.name,
              success,
              timestamp: Date.now(),
              snippet: success ? pick(JAILBREAK_SNIPPETS) : '',
            },
            ...prev,
          ].slice(0, 20));
        }
      }, 2000); // Wait exactly 2 seconds matching new period
    };

    const interval = setInterval(() => {
      // Generate attacks directly inside the loop
      const burstSize = rand(1, 2);
      for (let i = 0; i < burstSize; i++) {
        setTimeout(generateAttack, i * rand(50, 150)); // slight offset
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Removed Simulation Loop 2 since flash cleanup is handled dynamically by secondary setTimeouts now.

  // Remaining React UI Simulation Loops (HTML Panels only)
  useEffect(() => {
    const attacksTimer = setInterval(() => setTotalAttacks(prev => prev + rand(4, 9)), 800);
    const breachesTimer = setInterval(() => setSuccessfulBreaches(prev => prev + (Math.random() < 0.25 ? 1 : 0)), 1000);
    const connectionsTimer = setInterval(() => setActiveConnections(prev => Math.max(15, Math.min(48, prev + rand(-4, 4)))), 2000);
    const nodesTimer = setInterval(() => setActiveNodeCount(prev => Math.max(14, Math.min(22, prev + (Math.random() < 0.15 ? rand(-1, 1) : 0)))), 5000);
    return () => { clearInterval(attacksTimer); clearInterval(breachesTimer); clearInterval(connectionsTimer); clearInterval(nodesTimer); };
  }, []);

  useEffect(() => {
    const trafficTimer = setInterval(() => {
      setPromptsPerMin(prev => {
        const type = Math.random();
        if (type < 0.04) return rand(950, 1600);
        else if (type < 0.08) return rand(35, 80);
        return Math.max(120, Math.min(750, prev + rand(-40, 40)));
      });
    }, 1000);
    return () => clearInterval(trafficTimer);
  }, []);

  useEffect(() => {
    const timelineTimer = setInterval(() => {
      setTimeline(prev => {
        const base = Math.round(promptsPerMin / 15);
        return [...prev.slice(1), Math.max(2, base + rand(-5, 5))];
      });
    }, 1500);
    return () => clearInterval(timelineTimer);
  }, [promptsPerMin]);

  useEffect(() => {
    const vectorsTimer = setInterval(() => {
      setAttackVectors(prev => prev.map(v => Math.random() < 0.4 ? { ...v, count: v.count + rand(1, 4) } : v).sort((a, b) => b.count - a.count));
    }, 800);
    return () => clearInterval(vectorsTimer);
  }, []);

  const rawRate = totalAttacks > 0 ? (successfulBreaches / totalAttacks) * 100 : 18.3;
  const displayVulnRate = (rawRate + Math.sin(Date.now() / 4000) * 0.4).toFixed(1);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F172A]">
      <div ref={chartRef} className="absolute inset-0 z-0" />

      {/* ========== DESKTOP LAYOUT (lg+) — untouched ========== */}
      <div className="hidden lg:block">
      {/* ================= HEADER BRANDING ================= */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-5 left-5 z-10"
      >
        <div className="bg-[#0F172A]/90 backdrop-blur-md p-4 pr-10 border border-[#1E293B] rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShieldAlert className="w-8 h-8 text-slate-300" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#E11D48] rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-wider leading-none text-slate-100">
                <span>NEURAL</span>
                <span className="text-[#E11D48] ml-1">BREACH</span>
              </h1>
              <p className="text-[8px] text-slate-500 font-mono tracking-[4px] mt-1">
                AI ADVANCED SECURITY SOC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 mb-4 bg-[#0B1120] py-1 px-2 rounded border border-[#1E293B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
            <span className="text-[9px] font-mono text-[#E11D48] tracking-wide uppercase font-semibold">
              ACTIVE FUZZING SEQUENCE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-[#1E293B] pt-3">
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Prompts</p>
              <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">{totalAttacks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Breaches</p>
              <p className="text-sm font-mono font-bold text-[#E11D48] mt-0.5">{successfulBreaches.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Vuln %</p>
              <p className="text-sm font-mono font-bold text-[#D97706] mt-0.5">{displayVulnRate}%</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 space-y-2"
        >
          <Link href="/fuzzer" className="block">
            <button className="w-full flex items-center justify-between gap-3 text-[10px] font-mono font-semibold tracking-wider text-slate-300 hover:text-slate-100 bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3.5 py-3 transition-all shadow-md">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#E11D48]" />
                GO TO AI BREACH
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </Link>
          <Link href="/about" className="block">
            <button className="w-full flex items-center justify-between gap-3 text-[10px] font-mono font-semibold tracking-wider text-slate-300 hover:text-slate-100 bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3.5 py-3 transition-all shadow-md">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#10B981]" />
                ABOUT PROJECT
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {/* ================= TOP CONCURRENT METRICS ================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-5 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="bg-[#0F172A]/90 backdrop-blur-md px-5 py-2.5 flex items-center gap-6 border border-[#1E293B] rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase">PROMPTS / MIN</p>
              <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{promptsPerMin}</p>
            </div>
          </div>
          <div className="w-px h-6 bg-[#1E293B]" />
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase">ACTIVE NODES</p>
              <p className="text-xs font-mono font-bold text-[#8B5CF6] mt-0.5">{activeNodeCount}</p>
            </div>
          </div>
          <div className="w-px h-6 bg-[#1E293B]" />
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-[#10B981]" />
            <div>
              <p className="text-[8px] font-mono text-slate-500 uppercase">ACTIVE PATHS</p>
              <p className="text-xs font-mono font-bold text-[#10B981] mt-0.5">{activeConnections}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= RIGHT CONTROLS PANEL ================= */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-5 right-5 bottom-[100px] z-10 w-[310px] flex flex-col gap-3 overflow-y-auto scrollbar-thin pb-4"
      >
        <CollapsiblePanel title="Top Vulnerability Classes" icon={Crosshair}>
          <AttackVectorsPanel vectors={attackVectors} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Target Infrastructure Status" icon={Brain}>
          <ModelsPanel models={models} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Vulnerability Extraction Log" icon={AlertTriangle}>
          <JailbreaksFeed events={jailbreaks} />
        </CollapsiblePanel>
      </motion.div>

      {/* ================= BOTTOM METRICS TIMELINE ================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 z-10"
      >
        <div className="bg-[#0F172A]/95 backdrop-blur-md px-6 py-4 border-t border-[#1E293B] shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Fuzzing Traffic Activity Timeline
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
              Real-time Simulation Buffer
            </span>
          </div>

          <TimelineBar data={timeline} />

          <div className="flex justify-between mt-1.5 text-[8px] font-mono text-slate-600">
            <span>RUNNING LOGS</span>
            <span>CHRONOLOGICAL STREAM</span>
            <span>LIVE BUFFER</span>
          </div>
        </div>
      </motion.div>
      </div>{/* ===== end desktop layout ===== */}

      {/* ========== MOBILE LAYOUT (< lg) ========== */}
      {/* Touch the map to fade panels, release to bring them back */}
      <div
        className="lg:hidden absolute inset-0 z-10"
        onTouchStart={handleMapTouchStart}
        onTouchEnd={handleMapTouchEnd}
      >
        {/* ── TOP HEADER — fades out on map touch ── */}
        <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out
          ${mapActive ? 'opacity-0 pointer-events-none -translate-y-1' : 'opacity-100 translate-y-0'}`}>
          <div className="bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B] px-4 py-3 space-y-2">

            {/* Logo + Active badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShieldAlert className="w-6 h-6 text-slate-300" />
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#E11D48] rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-base font-bold font-mono tracking-wider leading-none text-slate-100">
                    NEURAL <span className="text-[#E11D48]">BREACH</span>
                  </h1>
                  <p className="text-[7px] text-slate-500 font-mono tracking-[3px] mt-0.5">AI ADVANCED SECURITY SOC</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0B1120] py-1 px-2 rounded border border-[#1E293B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                <span className="text-[8px] font-mono text-[#E11D48] tracking-wide uppercase font-semibold">ACTIVE</span>
              </div>
            </div>

            {/* Stats + live metrics in one row */}
            <div className="grid grid-cols-6 gap-1 bg-[#0B1120]/60 rounded-lg px-3 py-2 border border-[#1E293B]">
              <div className="col-span-1 text-center">
                <p className="text-[6px] font-mono text-slate-500 uppercase">Prompts</p>
                <p className="text-[10px] font-mono font-bold text-slate-200 mt-0.5">{totalAttacks.toLocaleString()}</p>
              </div>
              <div className="col-span-1 text-center border-x border-[#1E293B]">
                <p className="text-[6px] font-mono text-slate-500 uppercase">Breaches</p>
                <p className="text-[10px] font-mono font-bold text-[#E11D48] mt-0.5">{successfulBreaches.toLocaleString()}</p>
              </div>
              <div className="col-span-1 text-center">
                <p className="text-[6px] font-mono text-slate-500 uppercase">Vuln%</p>
                <p className="text-[10px] font-mono font-bold text-[#D97706] mt-0.5">{displayVulnRate}%</p>
              </div>
              <div className="col-span-1 text-center border-l border-[#1E293B]">
                <p className="text-[6px] font-mono text-slate-500 uppercase">P/Min</p>
                <p className="text-[10px] font-mono font-bold text-slate-200 mt-0.5">{promptsPerMin}</p>
              </div>
              <div className="col-span-1 text-center border-x border-[#1E293B]">
                <p className="text-[6px] font-mono text-slate-500 uppercase">Nodes</p>
                <p className="text-[10px] font-mono font-bold text-[#8B5CF6] mt-0.5">{activeNodeCount}</p>
              </div>
              <div className="col-span-1 text-center">
                <p className="text-[6px] font-mono text-slate-500 uppercase">Paths</p>
                <p className="text-[10px] font-mono font-bold text-[#10B981] mt-0.5">{activeConnections}</p>
              </div>
            </div>

            {/* Nav buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/fuzzer">
                <button className="w-full flex items-center justify-center gap-1.5 text-[9px] font-mono font-semibold tracking-wider text-slate-300 hover:text-slate-100 bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3 py-2 transition-all">
                  <Terminal className="w-3 h-3 text-[#E11D48]" />
                  GO TO AI BREACH
                </button>
              </Link>
              <Link href="/about">
                <button className="w-full flex items-center justify-center gap-1.5 text-[9px] font-mono font-semibold tracking-wider text-slate-300 hover:text-slate-100 bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3 py-2 transition-all">
                  <ShieldAlert className="w-3 h-3 text-[#10B981]" />
                  ABOUT PROJECT
                </button>
              </Link>
            </div>

            {/* Hint */}
            <p className="text-center text-[7px] font-mono text-slate-600 tracking-widest uppercase">
              ↕ Touch map to explore • Panels auto-hide
            </p>
          </div>
        </div>

        {/* ── BOTTOM PANELS — fades out on map touch ── */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out
          ${mapActive ? 'opacity-0 pointer-events-none translate-y-1' : 'opacity-100 translate-y-0'}`}>

          {/* Collapsible panels */}
          <div className="px-3 pt-2 space-y-0 bg-[#0F172A]/85 backdrop-blur-md">
            <CollapsiblePanel title="Top Vulnerability Classes" icon={Crosshair} defaultOpen={false}>
              <AttackVectorsPanel vectors={attackVectors} />
            </CollapsiblePanel>
            <CollapsiblePanel title="Target Infrastructure Status" icon={Brain} defaultOpen={false}>
              <ModelsPanel models={models} />
            </CollapsiblePanel>
            <CollapsiblePanel title="Vulnerability Extraction Log" icon={AlertTriangle} defaultOpen={false}>
              <JailbreaksFeed events={jailbreaks} />
            </CollapsiblePanel>
          </div>

          {/* Timeline */}
          <div className="bg-[#0F172A]/95 backdrop-blur-md px-4 py-2.5 border-t border-[#1E293B]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-slate-400" />
                <span className="text-[8px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Fuzzing Traffic
                </span>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Live Buffer</span>
            </div>
            <TimelineBar data={timeline} />
          </div>
        </div>
      </div>

    </div>
  );
}
