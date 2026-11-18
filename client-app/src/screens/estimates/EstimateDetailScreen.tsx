import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { DocumentPipelineStepper } from "../../components/DocumentPipelineStepper";
import { portalApi, Estimate } from "../../api/portal";
import { formatDate, formatCurrency } from "../../utils/date";

export const EstimateDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { estimateId } = route.params;
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await portalApi.getEstimate(estimateId);
      setEstimate(res.estimate);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load quotation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [estimateId]);

  const handleDownloadPdf = async () => {
    if (!estimate) return;
    try {
      setDownloadingPdf(true);
      const res = await portalApi.getEstimatePdfUrl(estimate.id);
      if (res.download_url) {
        await WebBrowser.openBrowserAsync(res.download_url);
      } else {
        Alert.alert("Notice", "Official quotation PDF is currently being generated. Please retry.");
      }
    } catch (err: any) {
      Alert.alert("Download Error", err.message || "Failed to initiate PDF download.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleRespond = (action: "accepted" | "declined") => {
    const title = action === "accepted" ? "Accept Quotation?" : "Decline Quotation?";
    const msg =
      action === "accepted"
        ? "Confirming will approve the deliverables and pricing so work can begin."
        : "Are you sure you want to decline this quotation?";

    Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel" },
      {
        text: action === "accepted" ? "Approve" : "Decline",
        style: action === "accepted" ? "default" : "destructive",
        onPress: async () => {
          try {
            setActing(true);
            const res = await portalApi.respondEstimate(estimateId, action);
            if (action === "accepted" && res.proforma_invoice) {
              Alert.alert(
                "Quotation Accepted",
                `Proforma Invoice #${res.proforma_invoice.proforma_number} has been generated for project mobilization.`,
                [
                  {
                    text: "View Proforma Invoice",
                    onPress: () => {
                      navigation.replace("InvoiceDetail", {
                        proformaId: res.proforma_invoice!.id,
                        type: "proforma",
                      });
                    },
                  },
                  {
                    text: "Stay Here",
                    style: "cancel",
                    onPress: () => fetchDetail(),
                  },
                ]
              );
            } else {
              Alert.alert("Success", res.message || `Quotation ${action} successfully.`);
              fetchDetail();
            }
          } catch (err: any) {
            Alert.alert("Action Failed", err.message || "Could not record response.");
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  if (loading || !estimate) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading quotation details...</Text>
      </View>
    );
  }

  // Internal draft protection
  if (estimate.status === "draft") {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-lock-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.loadingText, { marginTop: 12, fontFamily: fonts.bold }]}>
          Quotation In Preparation
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.regular,
            color: colors.textSecondary,
            textAlign: "center",
            paddingHorizontal: 32,
            marginTop: 4,
          }}
        >
          This quotation is currently being drafted by our engineering team and will be visible once officially issued.
        </Text>
      </View>
    );
  }

  const linkedProforma = estimate.proforma_invoices && estimate.proforma_invoices[0];
  const isConverted = estimate.status === "invoiced" || Boolean(linkedProforma);
  const isPending = !isConverted && estimate.status === "sent";
  const items = estimate.items || [];
  const isInclusive = estimate.tax_calculation_type === "inclusive";

  const totalAmountNum = Number(estimate.total_amount || estimate.total || 0);
  const taxAmountNum = Number(estimate.tax_amount || 0);
  const subtotalNum = Number(estimate.subtotal || 0);
  const roundOffNum = Number(estimate.round_off || 0);
  const discountNum = Number(estimate.discount_amount || 0);
  const taxableTurnover = isInclusive
    ? Math.max(0, totalAmountNum - roundOffNum - taxAmountNum)
    : subtotalNum - discountNum;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Visual Stepper */}
      <DocumentPipelineStepper
        currentStep="estimate"
        estimateNumber={estimate.estimate_number}
        estimateId={estimate.id}
        proformaNumber={linkedProforma?.proforma_number}
        proformaId={linkedProforma?.id}
        onNavigate={(type, id) => {
          if (type === "proforma") {
            navigation.navigate("InvoiceDetail", { proformaId: id, type: "proforma" });
          }
        }}
      />

      {/* Converted Proforma Notice Card */}
      {isConverted && linkedProforma && (
        <Card style={styles.conversionCard}>
          <View style={styles.conversionRow}>
            <View style={styles.conversionIconBg}>
              <Ionicons name="receipt-outline" size={18} color={colors.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.conversionTitle}>Converted to Proforma Invoice</Text>
              <Text style={styles.conversionSub}>
                Proforma #{linkedProforma.proforma_number} has been generated for this scope.
              </Text>
            </View>
            <Button
              title="View PI →"
              variant="primary"
              onPress={() =>
                navigation.navigate("InvoiceDetail", {
                  proformaId: linkedProforma.id,
                  type: "proforma",
                })
              }
              style={styles.conversionBtnCompact}
            />
          </View>
        </Card>
      )}

      {/* 1. Hero Valuation Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroDocGroup}>
            <Text style={styles.heroDocNumber}>{estimate.estimate_number}</Text>
            <Badge label="QUOTATION" variant="warning" size="sm" />
          </View>
          <Badge
            label={
              isConverted
                ? "CONVERTED"
                : estimate.status === "sent"
                ? "AWAITING APPROVAL"
                : estimate.status.toUpperCase()
            }
            variant={
              isConverted
                ? "purple"
                : estimate.status === "accepted"
                ? "success"
                : estimate.status === "declined"
                ? "danger"
                : "warning"
            }
            size="sm"
          />
        </View>

        <View style={styles.valuationBox}>
          <Text style={styles.valuationLabel}>PROPOSAL VALUE</Text>
          <Text style={styles.valuationAmount}>{formatCurrency(totalAmountNum)}</Text>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroFooterRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            {estimate.project?.name ? (
              <Text style={styles.projectText} numberOfLines={1}>
                Project: {estimate.project.name}
              </Text>
            ) : null}
            <Text style={styles.dateMetaText}>
              Issued: {formatDate(estimate.estimate_date)}
              {estimate.expiry_date ? ` • Valid until: ${formatDate(estimate.expiry_date)}` : ""}
            </Text>
          </View>

          <Button
            title="Download PDF"
            variant="outline"
            onPress={handleDownloadPdf}
            loading={downloadingPdf}
            icon={<Ionicons name="cloud-download-outline" size={14} color={colors.primary} />}
            style={styles.compactDownloadBtn}
          />
        </View>
      </Card>

      {/* 2. Scope & Deliverables Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Scope & Deliverables</Text>
        <Badge
          label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
          variant="neutral"
          size="sm"
        />
      </View>

      {items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.noItemsText}>No line items listed.</Text>
        </Card>
      ) : (
        items.map((item, idx) => {
          const itemTaxRate = item.tax_rate ?? estimate.tax_rate ?? 18;
          return (
            <Card key={item.id || idx} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemTitle}>
                  {item.item_name || item.description || "Scope Deliverable"}
                </Text>
                <Text style={styles.itemTotalAmount}>{formatCurrency(item.amount)}</Text>
              </View>

              {item.item_name && item.description ? (
                <Text style={styles.itemDescription} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.itemPillRow}>
                <View style={styles.itemCalcPill}>
                  <Text style={styles.itemCalcText}>
                    {item.quantity} {item.unit || "units"} × {formatCurrency(item.unit_price)}
                  </Text>
                  <Text style={styles.itemCalcDot}>•</Text>
                  <Text style={styles.itemGstText}>+{itemTaxRate}% GST</Text>
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* 3. Accounting Summary Card */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotalNum)}</Text>
        </View>

        {discountNum > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              -{formatCurrency(discountNum)}
            </Text>
          </View>
        )}

        {isInclusive ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(taxableTurnover)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({estimate.tax_rate || 18}% Included)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(taxAmountNum)}</Text>
            </View>
          </>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({estimate.tax_rate || 18}%)</Text>
            <Text style={styles.summaryValue}>+{formatCurrency(taxAmountNum)}</Text>
          </View>
        )}

        {roundOffNum !== 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Round Off</Text>
            <Text style={styles.summaryValue}>
              {roundOffNum > 0 ? "+" : ""}{formatCurrency(roundOffNum)}
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.grossLabel}>Total Amount</Text>
          <Text style={styles.grossValue}>{formatCurrency(totalAmountNum)}</Text>
        </View>
      </Card>

      {/* Terms & Conditions (if present) */}
      {estimate.notes || estimate.terms_and_conditions ? (
        <Card style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms & Scope Notes</Text>
          {estimate.notes ? (
            <Text style={styles.termsText}>{estimate.notes}</Text>
          ) : null}
          {estimate.terms_and_conditions ? (
            <Text style={[styles.termsText, estimate.notes ? { marginTop: 6 } : null]}>
              {estimate.terms_and_conditions}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {/* 4. Bottom Decision Card (When awaiting approval) */}
      {isPending && (
        <Card style={styles.decisionCard}>
          <Text style={styles.decisionTitle}>Ready to proceed?</Text>
          <Text style={styles.decisionSub}>
            Accept this proposal to approve the deliverables and mobilize the project.
          </Text>

          <View style={styles.actionButtonsRow}>
            <Button
              title="Decline"
              variant="outline"
              onPress={() => handleRespond("declined")}
              disabled={acting}
              style={{ flex: 1, marginRight: 10 }}
            />
            <Button
              title="Accept Quotation"
              variant="success"
              onPress={() => handleRespond("accepted")}
              loading={acting}
              icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.textLight} />}
              style={{ flex: 1.5 }}
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Converted Proforma Alert Card
  conversionCard: {
    backgroundColor: "#FAF5FF",
    borderColor: "#E9D5FF",
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
  },
  conversionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  conversionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  conversionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#6B21A8",
  },
  conversionSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7E22CE",
    marginTop: 1,
  },
  conversionBtnCompact: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  // 1. Hero Valuation Card
  heroCard: {
    marginBottom: 14,
    padding: 15,
    borderRadius: 16,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroDocGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDocNumber: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
  },
  valuationBox: {
    marginTop: 12,
    marginBottom: 10,
  },
  valuationLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  valuationAmount: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text,
    marginBottom: 2,
  },
  dateMetaText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  compactDownloadBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  // 2. Deliverables Section
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  emptyCard: {
    padding: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  noItemsText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  itemCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  itemTotalAmount: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  itemDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  itemPillRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemCalcPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 5,
  },
  itemCalcText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  itemCalcDot: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  itemGstText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.primary,
  },

  // 3. Summary Breakdown Card
  breakdownCard: {
    marginTop: 6,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
  },
  breakdownTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  grossLabel: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.text,
  },
  grossValue: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primary,
  },

  // Terms Card
  termsCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
  },
  termsTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  termsText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // 4. Decision Card
  decisionCard: {
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  decisionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#166534",
    marginBottom: 2,
  },
  decisionSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#15803D",
    marginBottom: 14,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
