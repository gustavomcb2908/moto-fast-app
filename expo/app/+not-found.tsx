import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Página não encontrada" }} />
      <View style={styles.container}>
        <AlertTriangle size={64} color={Colors.warning} />
        <Text style={styles.title}>Página não encontrada</Text>
        <Text style={styles.subtitle}>Esta página não existe</Text>

        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  link: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.surface,
  },
});
