import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export interface DocumentPipelineStepperProps {
  currentStep: "estimate" | "proforma" | "invoice";
  estimateNumber?: string;
  estimateId?: number;
  estimateStatus?: string;
  proformaNumber?: string;
  proformaId?: number;
  proformaStatus?: string;
  invoiceNumber?: string;
  invoiceId?: number;
  invoiceStatus?: string;
  onNavigate?: (type: "estimate" | "proforma" | "invoice", id: number) => void;
}

export const DocumentPipelineStepper: React.FC<DocumentPipelineStepperProps> = ({
  currentStep,
  estimateNumber,
  estimateId,
  estimateStatus = "accepted",
  proformaNumber,
  proformaId,
  proformaStatus = "unpaid",
  invoiceNumber,
  invoiceId,
  invoiceStatus = "unpaid",
  onNavigate,
}) => {
  const isEstimateDone = Boolean(proformaNumber || currentStep === "proforma" || currentStep === "invoice");
  const isProformaDone = Boolean(invoiceNumber || currentStep === "invoice");
  const isInvoicePaid = invoiceStatus === "paid";

  const handlePress = (type: "estimate" | "proforma" | "invoice", id?: number) => {
    if (id && onNavigate && type !== currentStep) {
      onNavigate(type, id);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>COMMERCIAL PROGRESSION</Text>

      <View style={styles.stepsRow}>
        {/* Step 1: Quotation */}
        <TouchableOpacity
          activeOpacity={estimateId && currentStep !== "estimate" ? 0.7 : 1}
          onPress={() => handlePress("estimate", estimateId)}
          style={[styles.stepItem, currentStep === "estimate" && styles.stepItemActive]}
        >
          <View
            style={[
              styles.stepCircle,
              isEstimateDone ? styles.circleCompleted : currentStep === "estimate" ? styles.circleActive : styles.circlePending,
            ]}
          >
            {isEstimateDone ? (
              <Ionicons name="checkmark" size={14} color={colors.textLight} />
            ) : (
              <Text style={[styles.stepNumber, currentStep === "estimate" && styles.stepNumberActive]}>1</Text>
            )}
          </View>
          <Text style={[styles.stepTitle, currentStep === "estimate" && styles.stepTitleActive]}>
            Quotation
          </Text>
          <Text style={styles.stepDocNumber} numberOfLines={1}>
            {estimateNumber || "EST Scope"}
          </Text>
        </TouchableOpacity>

        {/* Connector 1 */}
        <View style={[styles.connector, isEstimateDone && styles.connectorCompleted]} />

        {/* Step 2: Proforma Invoice */}
        <TouchableOpacity
          activeOpacity={proformaId && currentStep !== "proforma" ? 0.7 : 1}
          onPress={() => handlePress("proforma", proformaId)}
          style={[styles.stepItem, currentStep === "proforma" && styles.stepItemActive]}
        >
          <View
            style={[
              styles.stepCircle,
              isProformaDone
                ? styles.circleCompleted
                : currentStep === "proforma"
                ? styles.circleActive
                : proformaNumber
                ? styles.circlePurple
                : styles.circlePending,
            ]}
          >
            {isProformaDone ? (
              <Ionicons name="checkmark" size={14} color={colors.textLight} />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  currentStep === "proforma" && styles.stepNumberActive,
                  proformaNumber && { color: colors.textLight },
                ]}
              >
                2
              </Text>
            )}
          </View>
          <Text style={[styles.stepTitle, currentStep === "proforma" && styles.stepTitleActive]}>
            Proforma
          </Text>
          <Text style={styles.stepDocNumber} numberOfLines={1}>
            {proformaNumber || (isEstimateDone ? "PI Issued" : "Pending")}
          </Text>
        </TouchableOpacity>

        {/* Connector 2 */}
        <View style={[styles.connector, isProformaDone && styles.connectorCompleted]} />

        {/* Step 3: Tax Invoice */}
        <TouchableOpacity
          activeOpacity={invoiceId && currentStep !== "invoice" ? 0.7 : 1}
          onPress={() => handlePress("invoice", invoiceId)}
          style={[styles.stepItem, currentStep === "invoice" && styles.stepItemActive]}
        >
          <View
            style={[
              styles.stepCircle,
              isInvoicePaid
                ? styles.circlePaid
                : invoiceNumber
                ? styles.circleUnpaid
                : currentStep === "invoice"
                ? styles.circleActive
                : styles.circlePending,
            ]}
          >
            {isInvoicePaid ? (
              <Ionicons name="checkmark-done" size={14} color={colors.textLight} />
            ) : invoiceNumber ? (
              <Ionicons name="time" size={13} color={colors.textLight} />
            ) : (
              <Text style={[styles.stepNumber, currentStep === "invoice" && styles.stepNumberActive]}>3</Text>
            )}
          </View>
          <Text style={[styles.stepTitle, currentStep === "invoice" && styles.stepTitleActive]}>
            Tax Invoice
          </Text>
          <Text
            style={[
              styles.stepDocNumber,
              isInvoicePaid ? styles.statusPaidText : invoiceNumber ? styles.statusUnpaidText : null,
            ]}
            numberOfLines={1}
          >
            {isInvoicePaid ? "PAID" : invoiceNumber ? "UNPAID" : "Pending"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    width: 80,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  circlePending: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  circleCompleted: {
    backgroundColor: colors.primary,
  },
  circlePurple: {
    backgroundColor: colors.purple,
  },
  circlePaid: {
    backgroundColor: colors.success,
  },
  circleUnpaid: {
    backgroundColor: colors.warning,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: colors.textLight,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stepTitleActive: {
    color: colors.text,
    fontWeight: "800",
  },
  stepDocNumber: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  statusPaidText: {
    color: colors.success,
    fontWeight: "800",
  },
  statusUnpaidText: {
    color: colors.warning,
    fontWeight: "800",
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    marginTop: -16,
  },
  connectorCompleted: {
    backgroundColor: colors.primary,
  },
});
