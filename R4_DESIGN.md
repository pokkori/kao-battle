# R4設計書: 顔バトル — 根本原因分析 + 改善設計

## Part 1: 根本原因の徹底分析

### 1-1. なぜスコアが R2:25 → R3:21 と低下したか

**根本原因は1つ: 顔認識がモックのまま放置されている。**

`hooks/useExpression.ts` L38-48:
```typescript
intervalRef.current = setInterval(() => {
  tickRef.current += 1;
  const scores = generateMockExpression(tickRef.current);  // ← ここが全ての元凶
  const dominant = getDominantExpression(scores);
  setResult({
    dominant,
    scores,
    landmarks: ZERO_LANDMARKS,
    timestamp: Date.now(),
    faceDetected: true,  // ← 常にtrue（嘘）
  });
}, 100);
```

`lib/face/expressionClassifier.ts` L76-82:
```typescript
export function generateMockExpression(tick: number): ExpressionScores {
  const cycle = Math.floor(tick / 60) % 5;  // 6秒周期で自動切替
  const base = { angry: 0.1, happy: 0.1, surprise: 0.1, sad: 0.1, neutral: 0.1 };
  const keys = ["angry", "happy", "surprise", "sad", "neutral"];
  base[keys[cycle]] = 0.6 + Math.random() * 0.3;
  return base;
}
```

**評価者の指摘「レーシングゲームに車が存在しないのと同義」は100%正確。**

カメラ映像は `useWebCamera.ts` で取得・表示されるが、映像からの表情判定には一切使用されない。ユーザーの顔は飾りであり、実際のゲームプレイは4つのボタン（怒り/笑顔/驚き/悲しみ）のタップで成立している。

### 1-2. モックのままである技術的理由

コードベースを精査した結果、以下が判明:

1. **expressionClassifier.ts に実装済みのclassifyExpression関数が存在する** — FaceFeatures（口の開き、眉の上下、目の開き等）を受け取ってExpressionScoresを返すロジックは既に完成している
2. **landmarks.ts にMediaPipe Face Meshのランドマーク番号定義が存在する** — 468点のうち主要25点のインデックスが定義済み
3. **calibration.ts にニュートラル顔のキャリブレーションデータ構造がある** — 設計は完了している
4. **しかし、カメラ映像→ランドマーク検出→FaceFeatures算出の接続パイプラインが未実装**

つまり「パーツは揃っているが、配管が繋がっていない」状態。

### 1-3. 各技術方式の実現可能性調査

#### 方式A: MediaPipe Face Landmarker (@mediapipe/tasks-vision) — Web版 ★推奨

| 項目 | 内容 |
|---|---|
| パッケージ | `@mediapipe/tasks-vision` |
| 出力 | 478個の3Dランドマーク + **52個のblendshape係数（0.0〜1.0）** |
| blendshape例 | `mouthSmileLeft`, `mouthSmileRight`, `browDownLeft`, `browDownRight`, `eyeWideLeft`, `eyeWideRight`, `jawOpen` 等 |
| FPS | 30fps（一般的なPC/スマホブラウザ） |
| モデルサイズ | 約4MB（WASM+モデル）|
| 実装工数 | 1〜2日 |
| 制約 | WebAssembly必須。iOS Safari対応。HTTPS必須（カメラアクセス） |
| 最大の利点 | **blendshapeが直接返るため、expressionClassifier.tsのFaceFeaturesに直接マッピング可能** |

**blendshape→表情マッピング設計:**
- **怒り(angry)**: `browDownLeft + browDownRight` > 0.4 AND `mouthFrownLeft + mouthFrownRight` > 0.3
- **笑顔(happy)**: `mouthSmileLeft + mouthSmileRight` > 0.5 AND `cheekSquintLeft + cheekSquintRight` > 0.3
- **驚き(surprise)**: `eyeWideLeft + eyeWideRight` > 0.5 AND `jawOpen` > 0.4
- **悲しみ(sad)**: `mouthFrownLeft + mouthFrownRight` > 0.4 AND `browInnerUp` > 0.3

#### 方式B: TensorFlow.js + face-api.js — Web版 代替案

| 項目 | 内容 |
|---|---|
| パッケージ | `@vladmandic/face-api` (fork版、メンテ活発) |
| 出力 | 68個のランドマーク + 7感情スコア（happy, sad, angry, fearful, disgusted, surprised, neutral） |
| FPS | 15-25fps |
| モデルサイズ | 約6MB |
| 実装工数 | 1〜2日 |
| 制約 | TensorFlow.jsのロードが重い。初回起動が遅い |
| 備考 | 7感情が直接返るのでマッピング不要だが、精度がMediaPipeより劣る |

#### 方式C: react-native-vision-camera + ML Kit — ネイティブ版

| 項目 | 内容 |
|---|---|
| パッケージ | `react-native-vision-camera` + `react-native-vision-camera-face-detector` |
| 出力 | 顔の位置・角度・笑顔確率・目の開き確率 |
| FPS | 30fps+ |
| 実装工数 | 3〜5日（ネイティブビルド環境構築含む） |
| 制約 | ML Kitの表情出力は`smilingProbability`と`leftEyeOpenProbability`等のみ。怒り/驚き/悲しみの直接判定は不可 → ランドマーク座標から自前計算が必要 |
| 備考 | ネイティブアプリとして配信する場合は必須 |

#### 方式D: expo-camera + カスタムプラグイン — 現フレームワーク維持

| 項目 | 内容 |
|---|---|
| パッケージ | `expo-camera`（既にインストール済み） |
| 制約 | expo-cameraにはフレームプロセッサ機能がなく、リアルタイム表情検出は不可能 |
| 結論 | **不採用** — Expoのmanaged workflowでは顔認識のリアルタイム処理ができない |

### 1-4. 技術選定結論

**Web版（即時実装可能）: MediaPipe Face Landmarker (方式A)**
- 理由: blendshapeが52種類直接返るため、既存のclassifyExpression関数の入力に直結する
- 追加依存: `@mediapipe/tasks-vision` のみ
- 既存コードの `useWebCamera.ts` のvideoRef + `expressionClassifier.ts` のclassifyExpression に自然に接続可能

**ネイティブ版（将来）: react-native-vision-camera + ML Kit (方式C)**
- ただし現状Expoのmanaged workflowなのでejectが必要
- R4ではWeb版の完成を優先し、ネイティブ版はR5で対応

---

## Part 2: R4設計書

### 改善1: MediaPipe Face Landmarkerによるリアルタイム顔認識実装 ★最重要

**【DeepResearchの指摘】**: 顔認識がモックなので4ボタンタップゲームに過ぎない。コアコンセプトが未機能。
**【私の理解】**: `generateMockExpression`が6秒周期で自動切替するだけなので、ユーザーの顔の動きがゲームプレイに反映されない。これがスコア低下の唯一にして最大の原因。
**【実装計画】**: 以下の通り
**【懸念点】**: MediaPipeのWASMモデル（約4MB）の初回ロード時間。CDNから読み込むため初回3-5秒のローディングが発生する。

#### 技術選定: MediaPipe Face Landmarker
- パッケージ: `@mediapipe/tasks-vision`
- blendshape出力: 52種類の表情係数（0.0〜1.0）
- 対応プラットフォーム: Web (Chrome/Safari/Firefox)

#### 対象ファイルと変更内容

**新規ファイル: `hooks/useMediaPipeFace.ts`**
```
- @mediapipe/tasks-visionのFaceLandmarkerを初期化
- videoRef（HTMLVideoElement）からフレーム毎にdetectForVideo()を呼ぶ
- blendshape結果を返すhook
- ロード状態(loading/ready/error)を管理
- requestAnimationFrameベースで30fps処理
```

**変更ファイル: `hooks/useExpression.ts`**
```
- generateMockExpression()の呼び出しを削除
- useMediaPipeFace hookからblendshapeを受け取る
- blendshape→FaceFeatures変換関数を追加:
  mouthOpenRatio ← jawOpen
  mouthSmileRatio ← (mouthSmileLeft + mouthSmileRight) / 2
  leftEyeOpenRatio ← 1.0 - eyeBlinkLeft
  rightEyeOpenRatio ← 1.0 - eyeBlinkRight
  browRaiseRatio ← browInnerUp + (browOuterUpLeft + browOuterUpRight) / 2
  browFurrowRatio ← (browDownLeft + browDownRight) / 2
- classifyExpression()にFaceFeaturesを渡す（既存関数をそのまま活用）
- faceDetected: blendshapeが返ってくるか否かで判定（モックの常時trueを廃止）
- フォールバック: MediaPipeロード失敗時のみgenerateMockExpressionを使用
```

**変更ファイル: `app/battle.tsx`**
```
- useMediaPipeFace hookの結果をuseExpressionに接続
- MediaPipeロード中の表示（「顔認識を準備中...」ローディング画面）
- カメラが拒否された場合のフォールバックUI（ボタンモード）
- video要素のサイズを処理用に最適化（320x240維持）
```

**変更ファイル: `lib/face/expressionClassifier.ts`**
```
- blendshapeToFaceFeatures()変換関数を追加
- generateMockExpression()は残すがフォールバック専用に
- classifyExpression()の感度パラメータ調整（blendshape入力用にチューニング）
```

#### 認識する表情と判定ロジック

| 表情 | スキル | MediaPipe blendshape条件 | 閾値 |
|---|---|---|---|
| 怒り(angry) | パンチ | browDown > 0.35 AND (mouthFrown > 0.25 OR noseSneer > 0.3) | 合計スコア0.4以上 |
| 笑顔(happy) | バリア | mouthSmile > 0.4 AND cheekSquint > 0.2 | 合計スコア0.4以上 |
| 驚き(surprise) | ビーム | eyeWide > 0.4 AND jawOpen > 0.35 | 合計スコア0.4以上 |
| 悲しみ(sad) | ヒール | mouthFrown > 0.3 AND browInnerUp > 0.25 | 合計スコア0.4以上 |
| 無表情(neutral) | 待機 | 全blendshapeが閾値以下 | デフォルト |

#### ユーザー行動の変化
- **Before**: ボタンをタップして表情を「選ぶ」だけ。カメラは飾り
- **After**: カメラに向かって実際に怒り顔/笑顔/驚き顔/悲しい顔をすると、リアルタイムでスキルが発動。ボタンはフォールバック手段として残す

#### 影響軸と点数変化
- 楽しい度: 3→7 (+4) — コアコンセプト「顔で戦う」が初めて機能する
- 差別化: 3→7 (+4) — 顔認識バトルゲームとして成立する
- 使いやすさ: 5→6 (+1) — 顔の動きとスキル発動の因果関係が明確になる
- バズり度: 3→5 (+2) — 変顔で戦う映像がシェア素材になる

---

### 改善2: 表情認識フィードバックUIの強化

**【DeepResearchの指摘】**: emoji+テキストのみで表現性4/10
**【私の理解】**: 顔認識結果をリアルタイムにビジュアルフィードバックしないと、ユーザーは自分の顔がちゃんと読み取られているか分からない
**【実装計画】**: 以下の通り

#### 対象ファイルと変更内容

**変更ファイル: `app/battle.tsx` カメラプレビューエリア**
```
- カメラ映像の上に半透明の表情メーター（4方向レーダーチャート風）をオーバーレイ
- 現在検出中の表情の方向にリアルタイムでバーが伸びる
- スキル発動閾値ラインを表示（超えると光る）
- 顔が検出されていない時は「顔をカメラに向けてください」警告表示
- 表情スコアのリアルタイム数値表示（現在のexpressionScoresを4つのバーで表示）
```

**変更ファイル: `app/battle.tsx` スキル発動演出**
```
- スキル発動時にカメラ映像の周囲にスキル色のリングエフェクト
  - パンチ(怒り): 赤色リング
  - バリア(笑顔): 青色リング
  - ビーム(驚き): 黄色リング
  - ヒール(悲しみ): 緑色リング
- 発動瞬間にカメラフレームをキャプチャして一瞬フリーズ表示（「この顔で攻撃！」感）
```

#### ユーザー行動の変化
- ユーザーが自分の表情認識精度をリアルタイムで把握可能
- 「もっと大げさに表情を作らないと！」というフィードバックループが生まれる
- 変顔の面白さが視覚的に伝わる

#### 影響軸と点数変化
- 表現性: 4→6 (+2) — リアルタイム認識メーターで視覚的リッチに
- 使いやすさ: 6→7 (+1) — 顔認識状態が常に分かる

---

### 改善3: 変顔キャプチャ＆OGPシェアカード

**【DeepResearchの指摘】**: テキストシェアのみ。変顔キャプチャなし。バズり度3/10
**【私の理解】**: FaceDance Challengeが500万DLを達成した最大要因は「変顔の面白さをSNSでシェアできる」こと。現状テキストコピーのみ
**【実装計画】**: 以下の通り

#### 対象ファイルと変更内容

**変更ファイル: `app/battle.tsx`**
```
- スキル発動の瞬間にcaptureFrame()でカメラフレームを保存（最大5枚）
- 最もスコアが高かった瞬間のフレームを「ベストショット」として保持
- クリティカルヒット時のフレームを優先保存
```

**変更ファイル: `app/result.tsx`**
```
- Canvas APIで1200x630のOGPシェアカードを生成:
  - 背景: グラデーション（ステージテーマカラー）
  - 中央: キャプチャした変顔写真（円形クリップ、境界線付き）
  - 上部: 「顔バトル STAGE CLEAR!」テキスト
  - 右側: ランク・スコア・コンボ数
  - 下部: 「#顔バトル #FaceFight」ハッシュタグ
  - フッター: 「あなたも顔で戦おう！」CTA
- Webの場合: Canvasをdata URLに変換してダウンロード or Web Share API
- 「この顔で勝利！」ラベルを変顔写真の下に表示
```

**新規ファイル: `lib/share/generateShareCard.ts`**
```
- Canvas APIでOGPカード画像を生成する関数
- 入力: 変顔画像(data URL), ステージ名, ランク, スコア, コンボ数
- 出力: 1200x630 JPEG data URL
```

#### ユーザー行動の変化
- クリア後に自分の変顔入りシェアカードが自動生成される
- SNSに変顔画像付きで投稿したくなる（FaceDance Challengeと同じバイラルメカニズム）
- 友達に「この顔で勝ったw」と見せたくなる

#### 影響軸と点数変化
- バズり度: 5→7 (+2) — 変顔OGPカードがSNSバイラルの起点になる
- 表現性: 6→7 (+1) — シェアカードのビジュアル品質

---

### 改善4: BGMの実装

**【DeepResearchの指摘】**: BGMなし。表現性に致命的影響
**【私の理解】**: SEは`useBattleSE.ts`でWeb Audio API合成済みだが、BGMが完全に欠落。FaceDance Challengeは音楽のリズムに合わせて表情を作るのがコア体験

#### 対象ファイルと変更内容

**変更ファイル: `hooks/useBattleSE.ts`**
```
- BGM生成関数を追加（Web Audio APIによるプロシージャル生成）
- ステージ毎に異なるBGMパターン:
  - W1道場: 和風パーカッションループ（太鼓風）
  - W2火山: 重低音ドラムループ
  - W3遊園地: オルゴール風メロディループ
  - W4宇宙: シンセパッドアンビエント
  - W5感情: エピックオーケストラ風
- ボス戦: テンポアップ + ベース追加
- 音量設定と連動（settings画面）
```

**変更ファイル: `app/battle.tsx`**
```
- バトル開始時にBGM再生開始
- ポーズ時にBGM一時停止
- 勝利/敗北時にBGM停止→ジングル再生
- ボス登場時にBGM切替
```

#### 影響軸と点数変化
- 表現性: 7→8 (+1) — BGMでバトルの臨場感が大幅向上

---

### 改善5: キャリブレーション画面の実装

**【DeepResearchの指摘】**: 初見混乱。使いやすさ5/10
**【私の理解】**: 顔認識は個人差が大きい。キャリブレーション（ニュートラル顔の登録）なしでは精度が不安定になる

#### 対象ファイルと変更内容

**新規ファイル: `app/calibration.tsx`**
```
- ステップ1: 「リラックスした顔をカメラに向けてください」→ 3秒間のニュートラル顔をキャプチャ
- ステップ2: 「思いっきり笑ってください！」→ 笑顔の最大値を記録
- ステップ3: 「怒った顔をしてください！」→ 怒り顔の最大値を記録
- 結果をcalibration.tsのCalibrationDataとして保存
- 次回以降は保存データを使用（再キャリブレーションボタン付き）
```

**変更ファイル: `lib/face/calibration.ts`**
```
- recordNeutral(): ニュートラル状態のblendshapeを記録
- recordExpression(): 各表情の最大blendshapeを記録
- getCalibrated(): キャリブレーション済みかどうかを返す
- AsyncStorageに永続化
```

**変更ファイル: `app/battle.tsx`**
```
- 初回バトル開始前にキャリブレーション画面にリダイレクト
- キャリブレーション済みならスキップ
```

#### 影響軸と点数変化
- 使いやすさ: 7→8 (+1) — 個人差を吸収して認識精度向上

---

## R4実装後の予測スコア

| 軸 | R3 | R4予測 | 変化 | 根拠 |
|---|---|---|---|---|
| 表現性 | 4/10 | 8/10 | +4 | BGM+認識メーター+OGPカード |
| 使いやすさ | 5/10 | 8/10 | +3 | キャリブレーション+認識フィードバック |
| 楽しい度 | 3/10 | 7/10 | +4 | **顔認識が実機能する=コアコンセプト成立** |
| バズり度 | 3/10 | 7/10 | +4 | 変顔OGPシェアカード |
| 収益性 | 2/10 | 2/10 | 0 | KOMOJU未通過のため変化なし（コードで解決不可） |
| SEO・集客 | 1/10 | 2/10 | +1 | Vercelデプロイ後にOGPメタタグ追加のみ |
| 差別化 | 3/10 | 7/10 | +4 | 顔認識バトルとして唯一性が生まれる |

**合計: 21/70 → 41/70 (59%)** — +20点の改善

### コードで解決できない問題（正直申告）
1. **収益性**: KOMOJU審査未通過。IAP/広告は審査通過後の別タスク
2. **SEO・集客**: Vercelデプロイ+ドメイン設定は手動タスク。Expo Web exportの静的サイトではSSRベースのSEOは不可能
3. **ネイティブ版**: App Store/Google Play配信にはExpo eject + react-native-vision-cameraへの移行が必要（R5タスク）
4. **FaceDance Challengeとの差**: FaceDance Challengeは音楽のリズムに合わせた表情チャレンジ。顔バトルはRPGバトル形式。ゲームデザインの根本が異なるため「同じゲーム」にはならない

---

## 実装優先順位

| 順位 | 改善 | 工数 | 影響 |
|---|---|---|---|
| 1 | **改善1: MediaPipe顔認識実装** | 2日 | +13点（楽しい度+差別化+使いやすさ+バズり度） |
| 2 | 改善2: 認識フィードバックUI | 0.5日 | +3点 |
| 3 | 改善3: 変顔OGPシェアカード | 1日 | +3点 |
| 4 | 改善4: BGM実装 | 1日 | +1点 |
| 5 | 改善5: キャリブレーション | 0.5日 | +1点 |

**改善1が全体の65%のスコア改善を占める。これなしでは他の改善は全て無意味。**
