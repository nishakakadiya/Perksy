import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { StyleSheet } from "react-native";
import { store } from "../store";
import { theme } from "../theme";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}

function AppNavigator() {
  const screenOptions = {
    contentStyle: styles.screen,
    headerStyle: styles.header,
    headerTintColor: theme.colors.primary.DEFAULT,
    headerTitleStyle: styles.headerTitle,
  };

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: "Perksy" }} />
      <Stack.Screen name="offers/[offerId]" options={{ title: "Offer details" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
