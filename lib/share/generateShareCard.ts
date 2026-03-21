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

  const W = 1200;
  const H = 630;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background gradient (stage theme color)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(0.5, "#16213e");
  grad.addColorStop(1, "#0f3460");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = "#e94560";
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Inner glow lines
  ctx.strokeStyle = "rgba(79,195,247,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Top title: "顔バトル STAGE CLEAR!"
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("\u9854\u30D0\u30C8\u30EB STAGE CLEAR!", W / 2, 90);

  // Stage name
  ctx.fillStyle = "#aaa";
  ctx.font = "24px sans-serif";
  ctx.fillText(stageName, W / 2, 130);

  // Face image (circle clipped) - center-left area
  try {
    const img = await loadImage(faceImageDataUrl);
    const faceX = 350;
    const faceY = 315;
    const faceR = 130;

    // Circle border
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR + 6, 0, Math.PI * 2);
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
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\u3053\u306E\u9854\u3067\u52DD\u5229\uFF01", faceX, faceY + faceR + 36);
  } catch {
    // If face image fails, show placeholder text
    ctx.fillStyle = "#555";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\uD83D\uDE21", 350, 325);
  }

  // Right side: Rank, Score, Combo
  const rightX = 800;

  // Rank
  const rankColors: Record<string, string> = {
    S: "#ffd700", A: "#4CAF50", B: "#2196F3", C: "#9e9e9e", D: "#795548",
  };
  ctx.fillStyle = rankColors[rank] ?? "#fff";
  ctx.font = "bold 120px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(rank, rightX, 310);

  ctx.fillStyle = "#aaa";
  ctx.font = "24px sans-serif";
  ctx.fillText("RANK", rightX, 340);

  // Score
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(`SCORE: ${score.toLocaleString()}`, rightX, 400);

  // Combo
  ctx.fillStyle = "#e94560";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(`MAX COMBO: x${maxCombo}`, rightX, 445);

  // Streak badge
  if (loginStreak && loginStreak >= 2) {
    ctx.fillStyle = "rgba(255,107,53,0.85)";
    ctx.beginPath();
    ctx.roundRect(W - 340, H - 110, 300, 55, 8);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`\uD83D\uDD25 ${loginStreak}\u65E5\u9023\u7D9A!`, W - 55, H - 74);
  }

  // Bottom hashtags
  ctx.fillStyle = "#4fc3f7";
  ctx.font = "22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("#\u9854\u30D0\u30C8\u30EB #FaceFight #\u8868\u60C5\u30B2\u30FC\u30E0", W / 2, H - 60);

  // Footer CTA
  ctx.fillStyle = "#aaa";
  ctx.font = "18px sans-serif";
  ctx.fillText("\u3042\u306A\u305F\u3082\u9854\u3067\u6226\u304A\u3046\uFF01", W / 2, H - 32);

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
