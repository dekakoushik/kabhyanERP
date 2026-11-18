import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  size?: "sm" | "md";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  size = "md",
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case "success":
        return { bg: colors.successBg, border: colors.successBorder, text: colors.success };
      case "warning":
        return { bg: colors.warningBg, border: colors.warningBorder, text: colors.warning };
      case "danger":
        return { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger };
      case "info":
        return { bg: colors.infoBg, border: colors.infoBorder, text: colors.info };
      case "purple":
        return { bg: colors.purpleBg, border: colors.purpleBorder, text: colors.purple };
      default:
        return { bg: colors.background, border: colors.border, text: colors.textSecondary };
    }
  };

  const c = getColors();
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        { backgroundColor: c.bg, borderColor: c.border },
        style,
      ]}
    >
      <Text style={[styles.text, isSm && styles.textSm, { color: c.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 8.5,
    letterSpacing: 0.2,
  },
});
