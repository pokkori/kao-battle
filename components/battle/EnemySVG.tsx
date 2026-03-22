import React from "react";
import Svg, { Circle, Ellipse, Path, Rect, G } from "react-native-svg";

interface EnemySVGProps {
  enemyId: string;
  isBoss: boolean;
  enraged: boolean;
  size: number;
}

function EyePair({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <G>
      <Circle cx={cx - 12} cy={cy} r={r} fill={fill} />
      <Circle cx={cx + 12} cy={cy} r={r} fill={fill} />
    </G>
  );
}

export function EnemySVG({ enemyId, isBoss, enraged, size }: EnemySVGProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  const renderBody = () => {
    switch (enemyId) {
      case "e_slime":
        return (
          <G>
            <Circle cx={cx} cy={cy + 4} r={s * 0.38} fill="#66BB6A" opacity={0.85} />
            <Ellipse cx={cx} cy={cy + 4} rx={s * 0.38} ry={s * 0.28} fill="#81C784" opacity={0.6} />
            <EyePair cx={cx} cy={cy - 2} r={s * 0.065} fill="#1B5E20" />
            <Ellipse cx={cx - s * 0.1} cy={cy - s * 0.15} rx={s * 0.08} ry={s * 0.05} fill="rgba(255,255,255,0.5)" />
          </G>
        );
      case "e_wooden_dummy":
        return (
          <G>
            <Circle cx={cx} cy={cy - s * 0.1} r={s * 0.28} fill="#8D6E63" />
            <Rect x={cx - s * 0.12} y={cy + s * 0.18} width={s * 0.24} height={s * 0.25} rx={4} fill="#795548" />
            <EyePair cx={cx} cy={cy - s * 0.12} r={s * 0.05} fill="#3E2723" />
            <Path d={`M${cx - 8} ${cy + 0.22 * s} L${cx + 8} ${cy + 0.38 * s}`} stroke="#5D4037" strokeWidth="2" />
          </G>
        );
      case "e_ninja":
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.35} fill="#212121" />
            <Path d={`M${cx - s * 0.3} ${cy} Q${cx} ${cy - s * 0.45} ${cx + s * 0.3} ${cy}`} fill="#1A1A1A" />
            <EyePair cx={cx} cy={cy + 2} r={s * 0.055} fill="#FFFFFF" />
            <Path d={`M${cx + s * 0.3} ${cy - s * 0.1} L${cx + s * 0.42} ${cy} L${cx + s * 0.3} ${cy + s * 0.1}`} fill="#9E9E9E" />
          </G>
        );
      case "e_sumo":
        return (
          <G>
            <Circle cx={cx} cy={cy + 4} r={s * 0.42} fill="#FFCCBC" />
            <Ellipse cx={cx} cy={cy - s * 0.35} rx={s * 0.1} ry={s * 0.12} fill="#37474F" />
            <EyePair cx={cx} cy={cy - 4} r={s * 0.07} fill="#37474F" />
            <Path d={`M${cx - 10} ${cy + 14} Q${cx} ${cy + 22} ${cx + 10} ${cy + 14}`} stroke="#37474F" strokeWidth="2.5" fill="none" />
          </G>
        );
      case "e_boss_sensei":
        return (
          <G>
            <Circle cx={cx} cy={cy - 4} r={s * 0.32} fill="#EFEBE9" />
            <Rect x={cx - s * 0.22} y={cy + s * 0.12} width={s * 0.44} height={s * 0.3} rx={6} fill="#E0E0E0" />
            <Rect x={cx - s * 0.22} y={cy + s * 0.22} width={s * 0.44} height={s * 0.05} fill="#212121" />
            <EyePair cx={cx} cy={cy - 6} r={s * 0.06} fill="#4E342E" />
            <Path d={`M${cx - 18} ${cy - 14} L${cx - 8} ${cy - 18}`} stroke="#4E342E" strokeWidth="2" />
            <Path d={`M${cx + 8} ${cy - 18} L${cx + 18} ${cy - 14}`} stroke="#4E342E" strokeWidth="2" />
          </G>
        );
      case "e_fire_imp":
        return (
          <G>
            <Circle cx={cx} cy={cy + 4} r={s * 0.32} fill="#EF5350" />
            <Path d={`M${cx - 12} ${cy - s * 0.26} L${cx - 6} ${cy - s * 0.42} L${cx} ${cy - s * 0.26}`} fill="#B71C1C" />
            <Path d={`M${cx + 0} ${cy - s * 0.26} L${cx + 6} ${cy - s * 0.42} L${cx + 12} ${cy - s * 0.26}`} fill="#B71C1C" />
            <EyePair cx={cx} cy={cy} r={s * 0.06} fill="#FFFF00" />
          </G>
        );
      case "e_lava_golem":
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.4} fill="#546E7A" />
            <Path d={`M${cx - 10} ${cy - 20} L${cx} ${cy + 10} L${cx + 15} ${cy - 5}`} stroke="#FF1744" strokeWidth="3" fill="none" />
            <Path d={`M${cx - 20} ${cy + 10} L${cx + 5} ${cy + 25}`} stroke="#FF6D00" strokeWidth="2" fill="none" />
            <EyePair cx={cx} cy={cy - 4} r={s * 0.07} fill="#FF1744" />
          </G>
        );
      case "e_boss_volcano_dragon":
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.38} fill="#B71C1C" />
            <Path d={`M${cx - s * 0.2} ${cy - s * 0.15} L${cx} ${cy - s * 0.32} L${cx + s * 0.2} ${cy - s * 0.15}`} fill="#D32F2F" />
            <Path d={`M${cx - 16} ${cy - s * 0.35} L${cx - 8} ${cy - s * 0.48}`} stroke="#FF6F00" strokeWidth="4" strokeLinecap="round" />
            <Path d={`M${cx + 8} ${cy - s * 0.48} L${cx + 16} ${cy - s * 0.35}`} stroke="#FF6F00" strokeWidth="4" strokeLinecap="round" />
            <EyePair cx={cx} cy={cy - 2} r={s * 0.075} fill="#FFFF00" />
            <Path d={`M${cx - 8} ${cy + 14} L${cx - 4} ${cy + 22} L${cx} ${cy + 14}`} fill="#FFFFFF" />
            <Path d={`M${cx} ${cy + 14} L${cx + 4} ${cy + 22} L${cx + 8} ${cy + 14}`} fill="#FFFFFF" />
          </G>
        );
      case "e_alien":
        return (
          <G>
            <Ellipse cx={cx} cy={cy - 4} rx={s * 0.32} ry={s * 0.38} fill="#69F0AE" />
            <Ellipse cx={cx - 14} cy={cy - 8} rx={s * 0.1} ry={s * 0.06} fill="#1B5E20" />
            <Ellipse cx={cx + 14} cy={cy - 8} rx={s * 0.1} ry={s * 0.06} fill="#1B5E20" />
            <Path d={`M${cx} ${cy - s * 0.38} L${cx} ${cy - s * 0.5}`} stroke="#69F0AE" strokeWidth="2" />
            <Circle cx={cx} cy={cy - s * 0.52} r={4} fill="#69F0AE" />
          </G>
        );
      case "e_boss_cosmos_emperor":
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.38} fill="#1A237E" />
            <Path d={`M${cx - s * 0.26} ${cy - s * 0.3} L${cx - s * 0.18} ${cy - s * 0.45} L${cx} ${cy - s * 0.35} L${cx + s * 0.18} ${cy - s * 0.45} L${cx + s * 0.26} ${cy - s * 0.3}`} fill="#ffd700" />
            <EyePair cx={cx} cy={cy} r={s * 0.07} fill="#E040FB" />
            <Circle cx={cx} cy={cy} r={s * 0.38} fill="none" stroke="#7C4DFF" strokeWidth="2" opacity={0.5} />
          </G>
        );
      case "e_emotion_ghost":
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.34} fill="rgba(200,200,255,0.7)" />
            <Path d={`M${cx - s * 0.34} ${cy} Q${cx - s * 0.17} ${cy + s * 0.3} ${cx} ${cy + s * 0.2} Q${cx + s * 0.17} ${cy + s * 0.3} ${cx + s * 0.34} ${cy}`} fill="rgba(200,200,255,0.7)" />
            <EyePair cx={cx} cy={cy - 4} r={s * 0.065} fill="#3F51B5" />
          </G>
        );
      case "e_boss_emotion_king":
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.38} fill="#212121" />
            <Path d={`M${cx - s * 0.24} ${cy - s * 0.28} L${cx - s * 0.14} ${cy - s * 0.44} L${cx} ${cy - s * 0.33} L${cx + s * 0.14} ${cy - s * 0.44} L${cx + s * 0.24} ${cy - s * 0.28}`} fill="#ffd700" />
            <EyePair cx={cx} cy={cy - 2} r={s * 0.075} fill="#FF1744" />
            <Path d={`M${cx - 14} ${cy + 14} Q${cx} ${cy + 8} ${cx + 14} ${cy + 14}`} stroke="#FF1744" strokeWidth="3" fill="none" />
          </G>
        );
      default:
        return (
          <G>
            <Circle cx={cx} cy={cy} r={s * 0.36} fill="#9E9E9E" />
            <EyePair cx={cx} cy={cy - 4} r={s * 0.06} fill="#333" />
          </G>
        );
    }
  };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {enraged && (
        <Circle cx={cx} cy={cy} r={s * 0.46} fill="rgba(255,0,0,0.15)" />
      )}
      {renderBody()}
      {isBoss && (
        <Circle cx={cx} cy={cy} r={s * 0.44} fill="none" stroke="#ffd700" strokeWidth="3" opacity={0.8} />
      )}
    </Svg>
  );
}
