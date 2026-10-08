import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet } from "react-native";
import { OffersSection } from "../components/OffersSection";
import { UserDetails } from "../components/UserDetails";
import { theme } from "../theme";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <UserDetails />
      <OffersSection />
      <StatusBar style="dark" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing["2xl"],
    paddingBottom: theme.spacing["4xl"],
  },
});
