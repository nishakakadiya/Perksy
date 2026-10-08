import {
  Children,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { UserDetails } from "../UserDetails";
import { useGetCurrentUserProfileQuery } from "../../services/profileApi";
import type { UserProfile } from "../../services/mockApi";

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
    toArray: (children: ReactNode) =>
      Array.isArray(children) ? children : children == null ? [] : [children],
  },
}));

jest.mock("react/jsx-runtime", () => ({
  Fragment: Symbol.for("react.fragment"),
  jsx: (type: unknown, props: object, key: string | undefined) => ({
    type,
    props,
    key,
  }),
  jsxs: (type: unknown, props: object, key: string | undefined) => ({
    type,
    props,
    key,
  }),
}));

jest.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  StyleSheet: {
    create: (styles: unknown) => styles,
  },
  Text: "Text",
  View: "View",
}));

jest.mock("../../services/profileApi", () => ({
  useGetCurrentUserProfileQuery: jest.fn(),
}));

const profile: UserProfile = {
  id: "perksy-member-001",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  memberSince: "2024-03-15",
  tier: "Gold",
  pointsBalance: 2450,
};

const refetch = jest.fn();

type TestElement = ReactElement<{
  children?: ReactNode;
  [key: string]: unknown;
}>;

function renderUserDetails({
  data = profile,
  error,
  isError = false,
  isLoading = false,
}: {
  data?: UserProfile | undefined;
  error?: string | { message: string };
  isError?: boolean;
  isLoading?: boolean;
} = {}) {
  jest.mocked(useGetCurrentUserProfileQuery).mockReturnValue({
    data,
    error,
    isError,
    isLoading,
    refetch,
  } as ReturnType<typeof useGetCurrentUserProfileQuery>);
  return UserDetails() as TestElement;
}

function descendants(node: ReactNode): TestElement[] {
  const result: TestElement[] = [];
  Children.forEach(node, (child) => {
    if (child && typeof child === "object" && "props" in child) {
      const element = child as TestElement;
      result.push(element, ...descendants(element.props.children));
    }
  });
  return result;
}

function visibleText(element: TestElement) {
  return descendants(element)
    .filter((node) => node.type === "Text")
    .map((node) =>
      Children.toArray(node.props.children as ReactNode).join(""),
    );
}

describe("UserDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows member identity, points, tier, and join date", () => {
    const screen = renderUserDetails();
    const text = visibleText(screen);

    expect(text).toContain("Welcome back, Alex");
    expect(text).toContain("alex.morgan@example.com");
    expect(text).toContain("2,450");
    expect(text).toContain("Gold");
    expect(text).toContain("March 2024");
  });

  it("shows loading feedback while the profile is loading", () => {
    const screen = renderUserDetails({ data: undefined, isLoading: true });

    expect(
      descendants(screen).some((node) => node.type === "ActivityIndicator"),
    ).toBe(true);
    expect(visibleText(screen)).toContain("Loading your Perksy account...");
  });

  it("shows the query error and retries when requested", () => {
    const screen = renderUserDetails({
      data: undefined,
      error: { message: "Network unavailable" },
      isError: true,
    });
    const retry = descendants(screen).find(
      (node) =>
        node.type === "Pressable" && visibleText(node).includes("Try again"),
    );

    expect(visibleText(screen)).toContain("Network unavailable");
    (retry?.props.onPress as () => void)();
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
