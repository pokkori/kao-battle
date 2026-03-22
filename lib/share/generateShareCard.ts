/**
 * Generate OGP share card image using Canvas API.
 * Input: face image (data URL), stage name, rank, score, combo count
 * Output: 1200x630 JPEG data URL
 */
export async function generateShareCard(options: {
  faceImageDataUrl: string;
  stageName: string;
  rank: string;
  score: number;
  maxCombo: number;
  loginStreak?: number;    // ← 追加
}): Promise<string> {
  const { faceImageDataUrl, stageName, rank, score, maxCombo, loginStreak } = options;

  const W = 1080;
  const H = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background gradient (red theme for TikTok/Reels/Shorts)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(0.4, "#16213e");
  grad.addColorStop(1, "#0f1a2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = "#e94560";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Inner glow lines
  ctx.strokeStyle = "rgba(79,195,247,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // === Upper 25%: Logo + title ===
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 80px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("\u9854\u30D0\u30C8\u30EB", W / 2, 160);

  ctx.fillStyle = "#e94560";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText("STAGE CLEAR!", W / 2, 260);

  ctx.fillStyle = "#aaa";
  ctx.font = "36px sans-serif";
  ctx.fillText(stageName, W / 2, 340);

  // === Center 50%: Face + Score + Rank ===
  // Face image (circle clipped) - center
  const faceX = W / 2;
  const faceY = 700;
  const faceR = 200;

  try {
    const img = await loadImage(faceImageDataUrl);

    // Circle border
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR + 10, 0, Math.PI * 2);
    ctx.fillStyle = "#e94560";
    ctx.fill();

    // Clip and draw face
    ctx.save();
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, faceX - faceR, faceY - faceR, faceR * 2, faceR * 2);
    ctx.restore();

    // "この顔で勝利！" label below face
    ctx.fillStyle = "#e94560";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\u3053\u306E\u9854\u3067\u52DD\u5229\uFF01", faceX, faceY + faceR + 60);
  } catch {
    // If face image fails, show placeholder text
    ctx.fillStyle = "#555";
    ctx.font = "80px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\uD83D\uDE21", faceX, faceY + 30);
  }

  // Rank (large, center)
  const rankColors: Record<string, string> = {
    S: "#ffd700", A: "#4CAF50", B: "#2196F3", C: "#9e9e9e", D: "#795548",
  };
  const rankY = 1120;
  ctx.fillStyle = rankColors[rank] ?? "#fff";
  ctx.font = "bold 200px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(rank, W / 2, rankY);

  ctx.fillStyle = "#aaa";
  ctx.font = "40px sans-serif";
  ctx.fillText("RANK", W / 2, rankY + 50);

  // Score (large)
  ctx.fillStyle = "#fff";
  ctx.font = "bold 64px sans-serif";
  ctx.fillText(`SCORE: ${score.toLocaleString()}`, W / 2, rankY + 160);

  // Combo
  ctx.fillStyle = "#e94560";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText(`MAX COMBO: x${maxCombo}`, W / 2, rankY + 240);

  // Streak badge
  if (loginStreak && loginStreak >= 2) {
    ctx.fillStyle = "rgba(255,107,53,0.85)";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 240, rankY + 290, 480, 80, 12);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`\uD83D\uDD25 ${loginStreak}\u65E5\u9023\u7D9A!`, W / 2, rankY + 345);
  }

  // === Lower 25%: Hashtags + URL ===
  ctx.fillStyle = "#4fc3f7";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("#\u9854\u30D0\u30C8\u30EB #FaceFight", W / 2, H - 280);

  ctx.fillStyle = "#4fc3f7";
  ctx.font = "40px sans-serif";
  ctx.fillText("#\u8868\u60C5\u30B2\u30FC\u30E0 #\u5909\u9854\u30C1\u30E3\u30EC\u30F3\u30B8", W / 2, H - 220);

  // Footer CTA + URL
  ctx.fillStyle = "#aaa";
  ctx.font = "36px sans-serif";
  ctx.fillText("\u3042\u306A\u305F\u3082\u9854\u3067\u6226\u304A\u3046\uFF01", W / 2, H - 140);

  ctx.fillStyle = "#666";
  ctx.font = "32px sans-serif";
  ctx.fillText("face-fight.vercel.app", W / 2, H - 80);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
