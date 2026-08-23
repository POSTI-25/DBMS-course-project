"use client";

import { Star, Globe, Zap, Orbit, HelpCircle } from "lucide-react";
import type { CelestialType } from "./TelemetryDrawer";

interface Props {
  row: Record<string, unknown>;
  tableName: string;
}

function detectType(row: Record<string, unknown>): CelestialType {
  const spectral = String(row.spectral_type ?? "").toUpperCase();
  const name = String(row.name ?? "").toLowerCase();
  if (/galaxy|nebula|cluster/i.test(name)) return "galaxy";
  if (/comet|meteor|asteroid/i.test(name)) return "comet";
  if (/^(O|B|A|F|G|K|M|L|T|Y|W|R|N|S)/.test(spectral)) return "star";
  if (/^P[A-Z]/i.test(spectral) || /planet/i.test(name)) return "planet";
  if (spectral) return "star";
  return "unknown";
}

const CFG: Record<CelestialType, { icon: React.ElementType; label: string; cls: string }> = {
  star:    { icon: Star,       label: "Star",    cls: "badge-star"    },
  planet:  { icon: Globe,      label: "Planet",  cls: "badge-planet"  },
  galaxy:  { icon: Orbit,      label: "Galaxy",  cls: "badge-galaxy"  },
  comet:   { icon: Zap,        label: "Comet",   cls: "badge-comet"   },
  unknown: { icon: HelpCircle, label: "Unknown", cls: "badge-unknown" },
};

export default function CelestialBadge({ row, tableName }: Props) {
  if (tableName !== "celestial_bodies") return null;
  const type = detectType(row);
  const { icon: Icon, label, cls } = CFG[type];
  return (
    <span className={`badge ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}
