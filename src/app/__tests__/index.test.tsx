import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Children, type ReactElement } from "react";
import HomeScreen from "../index";

jest.mock("react-native", () => ({
  ScrollView: "ScrollView",
  StyleSheet: {
    create: (styles: unknown) => styles,
  },
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("../../components/UserDetails", () => ({
  UserDetails: "UserDetails",
}));

jest.mock("../../components/OffersSection", () => ({
  OffersSection: "OffersSection",
}));

describe("HomeScreen", () => {
  it("composes the member details and redeemable offers sections", () => {
    const screen = HomeScreen() as ReactElement<{
      children: ReactElement[];
      contentContainerStyle: { backgroundColor: string };
    }>;
    const children = Children.toArray(screen.props.children) as ReactElement[];

    expect(screen.type).toBe("ScrollView");
    expect(screen.props.contentContainerStyle.backgroundColor).toBe("#ffffff");
    expect(children.map((child) => child.type)).toEqual([
      "UserDetails",
      "OffersSection",
      "StatusBar",
    ]);
  });
});
