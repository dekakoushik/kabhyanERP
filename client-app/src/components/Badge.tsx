import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = "neutral", style }) => {
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

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
