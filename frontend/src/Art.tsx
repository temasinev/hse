/** Собственные предметные иллюстрации для тестового ассортимента. */
import { useId, useState } from "react";
import { colors, types } from "./shop";
import type { Product } from "./shop";
export function Art({ p, detail = false }: { p: Product; detail?: boolean }) {
  const uid = useId().replace(/:/g, ""),
    [broken, setBroken] = useState("");
  if (p.photo && p.photo !== broken)
    return (
      <img
        className="art"
        src={p.photo}
        alt={p.name}
        onError={() => setBroken(p.photo)}
      />
    );
  const k = Math.max(0, colors.indexOf(p.color)),
    ink = ["#6c1933", "#b5a68e", "#52634b", "#a96222"][k],
    bg = ["#e8c9cb", "#e4dbcf", "#d6ddd1", "#eddbbd"][k];
  const t = types.indexOf(p.type),
    drops = t === 1,
    count = drops ? 4 : t === 3 ? 14 : 33;
  return (
    <svg
      className="art"
      viewBox="0 0 400 330"
      role="img"
      aria-label={"Иллюстрация: " + p.name}
    >
      <defs>
        <radialGradient id={uid} cx=".32" cy=".23" r=".8">
          <stop stopColor="#fff9e3" />
          <stop offset=".2" stopColor={ink} />
          <stop offset=".75" stopColor={ink} />
          <stop offset="1" stopColor="#49332b" />
        </radialGradient>
        <pattern
          id={uid + "s"}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 0L4 4" stroke="#fff" opacity=".19" />
        </pattern>
      </defs>
      <rect width="400" height="330" fill={bg} />
      <rect width="400" height="330" fill={"url(#" + uid + "s)"} />
      <g
        transform={
          detail ? "translate(-83 -66) scale(1.5)" : "rotate(-16 200 165)"
        }
      >
        {(drops ? [145, 255] : [200]).map((cx) => (
          <g key={cx}>
            <ellipse
              cx={cx}
              cy={drops ? 126 : 160}
              rx={drops ? 19 : t === 3 ? 54 : 109}
              ry={drops ? 41 : t === 3 ? 66 : 116}
              fill="none"
              stroke="#aa8957"
              strokeWidth={drops || t === 3 ? 5 : 2}
            />
            {Array.from({ length: count }, (_, i) => {
              const a = (i * Math.PI * 2) / count,
                x = drops
                  ? cx + Math.sin(i * 2) * 6
                  : cx + Math.cos(a) * (t === 3 ? 54 : 109),
                y = drops
                  ? 165 + i * 13
                  : 160 + Math.sin(a) * (t === 3 ? 66 : 116);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={drops ? 10 + i : t === 3 ? 4 : 7 + 3 * Math.sin(a)}
                  fill={"url(#" + uid + ")"}
                />
              );
            })}
          </g>
        ))}
      </g>
    </svg>
  );
}
