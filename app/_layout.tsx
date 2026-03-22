import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import Head from "expo-router/head";

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
      <Head>
        <meta property="og:title" content="顔バトル - 表情で戦う！" />
        <meta property="og:description" content="カメラに顔を向けてリアル表情でバトル！変顔で敵を倒せ！" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
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
