const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../dist/index.html");

if (!fs.existsSync(filePath)) {
  console.log("dist/index.html not found, skipping OGP injection");
  process.exit(0);
}

let html = fs.readFileSync(filePath, "utf8");

// lang="ja"に変更（スペース数に関わらずマッチ）
html = html.replace(/<html([^>]*?)\s+lang="en"/, '<html$1 lang="ja"');

// OGPタグ注入（未注入の場合のみ）
if (!html.includes('property="og:title"')) {
  const ogTags = `
  <meta property="og:title" content="顔バトル - 表情でバトル！顔認識格闘ゲーム" />
  <meta property="og:description" content="笑顔・怒り・驚き・悲しみの表情でモンスターを倒す！スマホカメラで顔認識して戦う全く新しいアクションゲーム。" />
  <meta property="og:image" content="https://face-fight.vercel.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://face-fight.vercel.app" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="顔バトル - 表情でバトル！顔認識格闘ゲーム" />
  <meta name="twitter:description" content="笑顔・怒り・驚き・悲しみの表情でモンスターを倒す！スマホカメラで顔認識して戦う全く新しいアクションゲーム。" />
  <meta name="twitter:image" content="https://face-fight.vercel.app/og-image.png" />`;
  html = html.replace("</head>", ogTags + "\n</head>");
  console.log("OGP tags injected into dist/index.html");
} else {
  console.log("OGP tags already present, lang updated only");
}

fs.writeFileSync(filePath, html, "utf8");
console.log("inject-ogp.js completed");
