import React from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

// ExpressionTypeはbattle.tsxと同じ文字列リテラル型
type ExpressionType = "angry" | "happy" | "surprise" | "sad" | "neutral";

interface Props {
  expr: ExpressionType;
  size?: number;
  active?: boolean;
}

export function ExpressionFaceSVG({ expr, size = 40, active = false }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;

  const faceColors: Record<string, string> = {
    angry: "#EF5350",
    happy: "#FFF176",
    surprise: "#CE93D8",
    sad: "#90CAF9",
    neutral: "#B0BEC5",
  };

  const bg = faceColors[expr] ?? "#B0BEC5";

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} fill={bg} stroke={active ? "#ffd700" : "transparent"} strokeWidth="2" />
      <Ellipse cx={cx - size * 0.14} cy={cy - size * 0.06} rx={size * 0.06} ry={expr === "surprise" ? size * 0.09 : size * 0.06} fill="#1a1a2e" />
      <Ellipse cx={cx + size * 0.14} cy={cy - size * 0.06} rx={size * 0.06} ry={expr === "surprise" ? size * 0.09 : size * 0.06} fill="#1a1a2e" />
      {expr === "angry" && (
        <>
          <Path d={`M${cx - size * 0.22} ${cy - size * 0.22} L${cx - size * 0.08} ${cy - size * 0.18}`} stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
          <Path d={`M${cx + size * 0.08} ${cy - size * 0.18} L${cx + size * 0.22} ${cy - size * 0.22}`} stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
          <Path d={`M${cx - size * 0.16} ${cy + size * 0.16} Q${cx} ${cy + size * 0.08} ${cx + size * 0.16} ${cy + size * 0.16}`} stroke="#1a1a2e" strokeWidth="2" fill="none" />
        </>
      )}
      {expr === "happy" && (
        <Path d={`M${cx - size * 0.18} ${cy + size * 0.06} Q${cx} ${cy + size * 0.24} ${cx + size * 0.18} ${cy + size * 0.06}`} stroke="#1a1a2e" strokeWidth="2" fill="none" />
      )}
      {expr === "surprise" && (
        <Ellipse cx={cx} cy={cy + size * 0.16} rx={size * 0.1} ry={size * 0.12} fill="#1a1a2e" />
      )}
      {expr === "sad" && (
        <>
          <Path d={`M${cx - size * 0.22} ${cy - size * 0.18} L${cx - size * 0.08} ${cy - size * 0.22}`} stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
          <Path d={`M${cx + size * 0.08} ${cy - size * 0.22} L${cx + size * 0.22} ${cy - size * 0.18}`} stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
          <Path d={`M${cx - size * 0.14} ${cy + size * 0.18} Q${cx} ${cy + size * 0.08} ${cx + size * 0.14} ${cy + size * 0.18}`} stroke="#1a1a2e" strokeWidth="2" fill="none" />
        </>
      )}
      {expr === "neutral" && (
        <Path d={`M${cx - size * 0.14} ${cy + size * 0.14} L${cx + size * 0.14} ${cy + size * 0.14}`} stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      )}
    </Svg>
  );
}
