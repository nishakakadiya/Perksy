import {
  Children,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Stack } from "expo-router";
import RootLayout from "../_layout";
import { theme } from "../../theme";

jest.mock("react", () => ({
  Children: {
    forEach: (
      children: ReactNode,
      callback: (child: ReactNode) => void,
    ) => {
      for (const child of Array.isArray(children) ? children : [children]) {
        callback(child);
      }
    },
  },
}));

jest.mock("react/jsx-runtime", () => ({
  Fragment: Symbol.for("react.fragment"),
  jsx: (type: unknown, props: object, key: string | undefined) =>
    typeof type === "function"
      ? type(props)
      : {
          type,
          props,
          key,
        },
  jsxs: (type: unknown, props: object, key: string | undefined) =>
    typeof type === "function"
      ? type(props)
      : {
          type,
          props,
          key,
        },
}));

jest.mock("expo-router", () => ({
  Stack: {
    Screen: "StackScreen",
  },
}));

jest.mock("react-redux", () => ({
  Provider: "Provider",
}));

jest.mock("../../store", () => ({
  store: { testStore: true },
}));

jest.mock("react-native", () => ({
  StyleSheet: {
    create: (styles: unknown) => styles,
  },
}));

type TestElement = ReactElement<{
  children?: ReactNode;
  [key: string]: unknown;
}>;

function descendants(node: ReactNode): TestElement[] {
  const result: TestElement[] = [];
  if (Array.isArray(node)) {
    return node.flatMap((child) => descendants(child));
  }
  Children.forEach(node, (child) => {
    if (Array.isArray(child)) {
      result.push(...descendants(child));
      return;
    }
    if (child && typeof child === "object" && "props" in child) {
      const element = child as TestElement;
      result.push(element, ...descendants(element.props.children));
    }
  });
  return result;
}

describe("RootLayout", () => {
  it("provides the Redux store and configures the app navigation stack", () => {
    const screen = RootLayout() as TestElement;
    const nodes = descendants(screen);
    const stack = nodes.find((node) => node.type === Stack);
    const routeScreens = descendants(stack?.props.children as ReactNode).filter(
      (node) => node.type === Stack.Screen,
    );

    expect(screen.type).toBe("Provider");
    expect(screen.props.store).toEqual({ testStore: true });
    expect(stack).toBeDefined();
    expect(stack?.props.screenOptions).toMatchObject({
      headerTintColor: theme.colors.primary.DEFAULT,
      headerTitleStyle: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.fontSize.lg,
      },
    });
    expect(routeScreens.map((route) => route.props)).toEqual([
      { name: "index", options: { title: "Perksy" } },
      {
        name: "offers/[offerId]",
        options: { title: "Offer details" },
      },
    ]);
  });
});
