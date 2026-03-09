export const ENERGY_MODE_OPTIONS = [
  {
    id: "auto",
    label: "Auto Balance",
    hint: "Route by difficulty",
    activeClass: "border-[#1d6d47] bg-[#0f2f20] text-white shadow-[0_14px_30px_-18px_rgba(15,47,32,0.75)]",
    idleClass: "border-[#cad8cf] bg-white text-[#3d5f4b] hover:bg-[#eef6f0]",
    chipClass: "border-[#cad8cf] bg-white text-[#3d5f4b]"
  },
  {
    id: "fast",
    label: "Low Energy",
    hint: "Fast and efficient",
    activeClass: "border-[#2a9d62] bg-[#2a9d62] text-white shadow-[0_14px_30px_-18px_rgba(42,157,98,0.75)]",
    idleClass: "border-[#bfe1cc] bg-white text-[#1d6d47] hover:bg-[#eaf7ef]",
    chipClass: "border-[#bfe1cc] bg-[#edf9f1] text-[#1d6d47]"
  },
  {
    id: "deep",
    label: "High Energy",
    hint: "Deep reasoning",
    activeClass: "border-[#c44949] bg-[#c44949] text-white shadow-[0_14px_30px_-18px_rgba(196,73,73,0.75)]",
    idleClass: "border-[#ebc2c2] bg-white text-[#8d2f2f] hover:bg-[#fff1f1]",
    chipClass: "border-[#ebc2c2] bg-[#fff3f3] text-[#9d3030]"
  }
];

const ENERGY_BY_KEY = Object.fromEntries(ENERGY_MODE_OPTIONS.map((option) => [option.id, option]));

function titleCase(value) {
  return String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function energyKeyFromMeta(meta = {}) {
  if (meta.energyMode === "high" || meta.role === "deep") {
    return "deep";
  }
  if (meta.energyMode === "low" || meta.role === "fast") {
    return "fast";
  }

  const model = String(meta.model || "").toLowerCase();
  if (model.includes("high") || model.includes("deep")) {
    return "deep";
  }
  if (model.includes("low") || model.includes("fast")) {
    return "fast";
  }
  return "auto";
}

export function energyLabelFromMeta(meta = {}) {
  return ENERGY_BY_KEY[energyKeyFromMeta(meta)]?.label || "Auto Balance";
}

export function energyOptionById(id) {
  return ENERGY_BY_KEY[id] || ENERGY_BY_KEY.auto;
}

export function modelDisplayName(model) {
  const cleaned = String(model || "")
    .replace(/-(mock|own)$/i, "")
    .trim();

  if (!cleaned) {
    return "Unknown Model";
  }
  if (/router/i.test(cleaned)) {
    return "Energy Router";
  }
  if (/(high|deep)/i.test(cleaned)) {
    return "Energy AI High-Energy";
  }
  if (/(low|fast)/i.test(cleaned)) {
    return "Energy AI Low-Energy";
  }
  return titleCase(cleaned);
}
