export const fonts = {
  regular: "GoogleSans-Regular",
  medium: "GoogleSans-Medium",
  bold: "GoogleSans-Bold",
};

export const typography = {
  hero: {
    fontFamily: fonts.bold,
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#0F172A",
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#0F172A",
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#0F172A",
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    fontWeight: "400" as const,
    color: "#334155",
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#64748B",
  },
  micro: {
    fontFamily: fonts.medium,
    fontSize: 10,
    fontWeight: "600" as const,
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
};
