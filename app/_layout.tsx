import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import Head from "expo-router/head";

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
      <Head>
        <title>顔バトル - 表情で戦う！変顔ゲーム</title>
        <meta name="description" content="カメラに顔を向けてリアル表情でバトル！変顔で敵を倒せ！表情認識AIゲーム。" />
        <meta name="keywords" content="顔バトル,変顔,表情認識,カメラゲーム,FaceFight" />
        <meta property="og:title" content="顔バトル - 表情で戦う！" />
        <meta property="og:description" content="カメラに顔を向けてリアル表情でバトル！変顔で敵を倒せ！" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://face-fight.vercel.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://face-fight.vercel.app/og-image.png" />
      </Head>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1a1a2e" },
          animation: "fade",
        }}
      />
    </View>
  );
}
