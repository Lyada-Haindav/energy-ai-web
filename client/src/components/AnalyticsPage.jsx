import { BarChart3, Flame, Gauge, Leaf, Timer } from "lucide-react";
import { energyKeyFromMeta, modelDisplayName } from "../lib/energy";

const ENERGY_TO_SCORE = {
  A: 92,
  B: 74,
  C: 46,
  D: 18
};

function summarizeMessages(sessions) {
  const assistantMessages = sessions
    .flatMap((session) => session.messages || [])
    .filter((message) => message.role === "assistant" && message.meta?.model && message.meta.model !== "bootstrap");

  const modelCounts = new Map();
  const energySeries = [];
  const latencySeries = [];
  let lowEnergyResponses = 0;
  let highEnergyResponses = 0;

  assistantMessages.forEach((message, index) => {
    const energyKey = energyKeyFromMeta(message.meta);
    const label = modelDisplayName(message.meta.model);
    const current = modelCounts.get(label) || { label, count: 0, energyKey };
    current.count += 1;
    current.energyKey = current.energyKey === "auto" ? energyKey : current.energyKey;
    modelCounts.set(label, current);

    if (energyKey === "fast") {
      lowEnergyResponses += 1;
    }
    if (energyKey === "deep") {
      highEnergyResponses += 1;
    }

    const energyScore = ENERGY_TO_SCORE[message.meta.energyScore] ?? null;
    if (energyScore !== null) {
      energySeries.push({ x: index + 1, y: energyScore });
    }

    const latency = Number(message.meta.latencyMs || 0);
    if (latency > 0) {
      latencySeries.push({ x: index + 1, y: latency });
    }
  });

  const usageBars = [...modelCounts.values()].sort((left, right) => right.count - left.count);
  const avgLatency = latencySeries.length
    ? Math.round(latencySeries.reduce((sum, point) => sum + point.y, 0) / latencySeries.length)
    : 0;

  return {
    totalAssistantResponses: assistantMessages.length,
    lowEnergyResponses,
    highEnergyResponses,
    usageBars,
    energySeries,
    latencySeries,
    avgLatency
  };
}

function sparklinePath(points) {
  if (points.length === 0) {
    return "";
  }

  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const range = Math.max(maxY - minY, 1);
  const span = Math.max(points.length - 1, 1);

  return points
    .map((point, index) => {
      const x = (index / span) * 100;
      const y = 100 - ((point.y - minY) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function MetricCard({ title, value, icon: Icon, tint }) {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-[#5c7463]">{title}</p>
        <span className={`rounded-xl p-2 ${tint}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="font-display text-2xl font-bold text-[#14261a] sm:text-3xl">{value}</p>
    </article>
  );
}

function ModelUsageChart({ usageBars }) {
  if (usageBars.length === 0) {
    return (
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
        <h3 className="mb-2 font-display text-xl font-semibold text-[#14261a]">Model Usage</h3>
        <p className="text-sm text-[#61786a]">Start chatting to generate usage analytics.</p>
      </section>
    );
  }

  const maxCount = Math.max(...usageBars.map((item) => item.count), 1);

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
      <h3 className="mb-4 font-display text-xl font-semibold text-[#14261a]">Model Usage</h3>
      <div className="space-y-3">
        {usageBars.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm text-[#496252]">
              <span>{item.label}</span>
              <span className="font-mono">{item.count}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  item.energyKey === "deep"
                    ? "bg-gradient-to-r from-[#f09f9f] to-[#c44949]"
                    : "bg-gradient-to-r from-[#8fd0a8] to-[#2a9d62]"
                }`}
                style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LineChart({ title, points, suffix, stroke }) {
  const path = sparklinePath(points);

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
      <h3 className="mb-3 font-display text-xl font-semibold text-[#14261a]">{title}</h3>
      {points.length === 0 ? (
        <p className="text-sm text-[#61786a]">Not enough responses yet to render this graph.</p>
      ) : (
        <div>
          <svg viewBox="0 0 100 100" className="h-36 w-full rounded-2xl bg-white p-2 sm:h-44">
            <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" />
          </svg>
          <div className="mt-2 flex items-center justify-between text-xs text-[#61786a]">
            <span>Earlier</span>
            <span>Recent</span>
          </div>
          <p className="mt-2 text-sm text-[#496252]">
            Last point: {points[points.length - 1].y}
            {suffix}
          </p>
        </div>
      )}
    </section>
  );
}

export default function AnalyticsPage({ sessions }) {
  const metrics = summarizeMessages(sessions);

  return (
    <section className="space-y-4">
      <header className="rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-[#5c7463]">Analytics Dashboard</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[#14261a] sm:text-3xl">Energy AI Usage</h2>
        <p className="mt-1 text-sm text-[#496252]">
          Track how often Energy AI stays efficient in low-energy mode versus escalating to high-energy reasoning.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Responses"
          value={metrics.totalAssistantResponses}
          icon={BarChart3}
          tint="bg-[#ebf2ed] text-[#214d34]"
        />
        <MetricCard title="Low Energy" value={metrics.lowEnergyResponses} icon={Leaf} tint="bg-[#edf9f1] text-[#1d6d47]" />
        <MetricCard title="High Energy" value={metrics.highEnergyResponses} icon={Flame} tint="bg-[#fff3f3] text-[#9d3030]" />
        <MetricCard title="Avg Latency" value={`${metrics.avgLatency} ms`} icon={Timer} tint="bg-[#f7efe1] text-[#9b6a1d]" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ModelUsageChart usageBars={metrics.usageBars} />
        <LineChart title="Energy Efficiency Trend" points={metrics.energySeries} suffix="%" stroke="#2a9d62" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <LineChart title="Latency Trend" points={metrics.latencySeries} suffix=" ms" stroke="#b97816" />
        <MetricCard title="Models Active" value={metrics.usageBars.length} icon={Gauge} tint="bg-[#ebf2ed] text-[#214d34]" />
      </div>
    </section>
  );
}
