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
    const title = action === "accepted" ? "Accept Scope & Quotation?" : "Decline Quotation?";
    const msg =
      action === "accepted"
        ? "By accepting, you confirm approval of the deliverables and pricing."
        : "Are you sure you want to decline this proposal?";

    Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel" },
      {
        text: action === "accepted" ? "Approve" : "Decline",
        style: action === "accepted" ? "default" : "destructive",
        onPress: async () => {
          try {
            setActing(true);
            const res = await portalApi.respondEstimate(estimateId, action);
            Alert.alert("Success", res.message || `Quotation ${action} successfully.`);
            fetchDetail();
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
        <Text style={[styles.loadingText, { marginTop: 12, fontWeight: "600" }]}>
          Quotation In Preparation
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center", paddingHorizontal: 32, marginTop: 4 }}>
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
              <Ionicons name="receipt-outline" size={20} color={colors.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.conversionTitle}>Converted to Proforma Invoice</Text>
              <Text style={styles.conversionSub}>
                Scope approved & mobilized under Proforma #{linkedProforma.proforma_number}
              </Text>
            </View>
          </View>
          <Button
            title="View Proforma Invoice →"
            variant="primary"
            onPress={() =>
              navigation.navigate("InvoiceDetail", {
                proformaId: linkedProforma.id,
                type: "proforma",
              })
            }
            style={styles.conversionBtn}
          />
        </Card>
      )}

      {/* Header Info Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.estNumber}>{estimate.estimate_number}</Text>
            <Text style={styles.dateText}>Issued on: {formatDate(estimate.estimate_date)}</Text>
            {estimate.expiry_date && (
              <Text style={styles.dateText}>Valid until: {formatDate(estimate.expiry_date)}</Text>
            )}
          </View>
          <Badge
            label={isConverted ? "CONVERTED TO PROFORMA" : estimate.status.toUpperCase()}
            variant={
              isConverted
                ? "purple"
                : estimate.status === "accepted"
                ? "success"
                : estimate.status === "declined"
                ? "danger"
                : "warning"
            }
          />
        </View>

        {/* Download PDF Action Button */}
        <View style={styles.downloadRow}>
          <Button
            title="Download Official PDF"
            variant="outline"
            onPress={handleDownloadPdf}
            loading={downloadingPdf}
            icon={<Ionicons name="cloud-download-outline" size={16} color={colors.primary} />}
            style={{ width: "100%" }}
          />
        </View>

        {isPending && (
          <View style={styles.actionButtonsRow}>
            <Button
              title="Decline"
              variant="outline"
              onPress={() => handleRespond("declined")}
              disabled={acting}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Approve Scope"
              variant="success"
              onPress={() => handleRespond("accepted")}
              loading={acting}
              icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.textLight} />}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Card>

      {/* Itemized Deliverables Table */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scope Deliverables & Schedule</Text>
      </View>

      {items.length === 0 ? (
        <Card>
          <Text style={styles.noItemsText}>Comprehensive scope deliverables included</Text>
        </Card>
      ) : (
        items.map((item, idx) => {
          const itemTaxRate = item.tax_rate ?? estimate.tax_rate ?? 18;
          return (
            <Card key={item.id || idx} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.item_name || item.description || "Scope Deliverable"}</Text>
              {item.item_name && item.description ? (
                <Text style={styles.itemDescription}>{item.description}</Text>
              ) : null}
              
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemQty}>
                  Qty: {item.quantity} {item.unit || "units"} @ {formatCurrency(item.unit_price)}
                </Text>
                <View style={styles.gstBadge}>
                  <Text style={styles.gstBadgeText}>+{itemTaxRate}% GST</Text>
                </View>
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.itemFooterRow}>
                <Text style={styles.itemTaxable}>
                  Turnover: {formatCurrency(item.amount)}
                </Text>
                <Text style={styles.itemTotal}>
                  Line Total: {formatCurrency(item.amount)}
                </Text>
              </View>
            </Card>
          );
        })
      )}

      {/* Accounting Financial Summary (Matches Web ERP Exactly) */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Commercial Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Deliverables Turnover ({isInclusive ? "Gross" : "Subtotal"})
          </Text>
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
              <Text style={styles.summaryLabel}>Taxable Turnover</Text>
              <Text style={styles.summaryValue}>{formatCurrency(taxableTurnover)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({estimate.tax_rate || 18}% Included)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(taxAmountNum)}</Text>
            </View>
          </>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST / Tax (+{estimate.tax_rate || 18}%)</Text>
            <Text style={styles.summaryValue}>+{formatCurrency(taxAmountNum)}</Text>
          </View>
        )}

        {roundOffNum !== 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Round Off Adjustment</Text>
            <Text style={styles.summaryValue}>
              {roundOffNum > 0 ? "+" : ""}{formatCurrency(roundOffNum)}
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.grossLabel}>Net Proposal Total</Text>
          <Text style={styles.grossValue}>{formatCurrency(totalAmountNum)}</Text>
        </View>
      </Card>
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
    fontSize: 13,
    color: colors.textSecondary,
  },
  conversionCard: {
    backgroundColor: "#FAF5FF",
    borderColor: "#E9D5FF",
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  conversionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  conversionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  conversionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6B21A8",
  },
  conversionSub: {
    fontSize: 11,
    color: "#7E22CE",
    marginTop: 2,
    fontWeight: "500",
  },
  conversionBtn: {
    marginTop: 12,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  estNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  downloadRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButtonsRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  itemCard: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  itemMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQty: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gstBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gstBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  itemFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTaxable: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  noItemsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  breakdownCard: {
    marginTop: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  grossLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  grossValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
});
