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
  loginStreak?: number;
}): Promise<string> {
  const { faceImageDataUrl, stageName, rank, score, maxCombo, loginStreak } = options;

  const W = 1200;
  const H = 630;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background gradient (horizontal layout)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(0.4, "#16213e");
  grad.addColorStop(1, "#0f1a2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = "#e94560";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  // Vertical divider line (left zone / right zone)
  ctx.beginPath();
  ctx.moveTo(420, 0);
  ctx.lineTo(420, H);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(79,195,247,0.4)";
  ctx.stroke();

  // === Left zone (x:0~420, full height 630): Face image ===
  const faceX = 210;
  const faceY = 315;
  const faceR = 150;

  try {
    const img = await loadImage(faceImageDataUrl);

    // Circle border
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR + 8, 0, Math.PI * 2);
    ctx.fillStyle = "#e94560";
    ctx.fill();

    // Clip and draw face
    ctx.save();
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, faceX - faceR, faceY - faceR, faceR * 2, faceR * 2);
    ctx.restore();
  } catch {
    // If face image fails, show placeholder
    ctx.fillStyle = "#555";
    ctx.font = "80px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FACE", faceX, faceY + 30);
  }

  // === Right zone (x:430~1200, full height 630): Text vertical stack ===
  ctx.textAlign = "center";

  // Rank color map
  const rankColors: Record<string, string> = {
    S: "#ffd700", A: "#4CAF50", B: "#2196F3", C: "#9e9e9e", D: "#795548",
  };

  // Title "顔バトル"
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText("\u9854\u30D0\u30C8\u30EB", 820, 90);

  // STAGE CLEAR!
  ctx.fillStyle = "#e94560";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText("STAGE CLEAR!", 820, 150);

  // Rank (large)
  ctx.fillStyle = rankColors[rank] ?? "#fff";
  ctx.font = "bold 160px sans-serif";
  ctx.fillText(rank, 820, 350);

  // SCORE
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("SCORE: " + score.toLocaleString(), 820, 430);

  // MAX COMBO
  ctx.fillStyle = "#e94560";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("MAX COMBO: x" + maxCombo, 820, 480);

  // Streak badge (if streak >= 2)
  if (loginStreak && loginStreak >= 2) {
    const badgeX = 820;
    const badgeY = 520;
    const badgeW = 220;
    const badgeH = 36;
    ctx.fillStyle = "rgba(255, 100, 0, 0.25)";
    ctx.beginPath();
    ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 18);
    ctx.fill();
    ctx.strokeStyle = "#ff6400";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ff6400";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`HOT! ${loginStreak}日連続プレイ中！`, badgeX, badgeY + 8);
  }

  // Hashtags
  ctx.fillStyle = "#4fc3f7";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("#顔バトル #FaceFight", 820, loginStreak && loginStreak >= 2 ? 558 : 540);

  // URL
  ctx.fillStyle = "#888";
  ctx.font = "24px sans-serif";
  ctx.fillText("face-fight.vercel.app", 820, loginStreak && loginStreak >= 2 ? 600 : 590);

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
