import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline" | "success";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          container: { backgroundColor: colors.secondary, borderColor: colors.secondary },
          text: { color: colors.textLight },
        };
      case "danger":
        return {
          container: { backgroundColor: colors.danger, borderColor: colors.danger },
          text: { color: colors.textLight },
        };
      case "success":
        return {
          container: { backgroundColor: colors.success, borderColor: colors.success },
          text: { color: colors.textLight },
        };
      case "outline":
        return {
          container: { backgroundColor: "transparent", borderColor: colors.border },
          text: { color: colors.textSecondary },
        };
      default:
        return {
          container: { backgroundColor: colors.primary, borderColor: colors.primary },
          text: { color: colors.textLight },
        };
    }
  };

  const current = getStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        current.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={current.text.color} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, current.text, icon ? { marginLeft: 8 } : undefined, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
