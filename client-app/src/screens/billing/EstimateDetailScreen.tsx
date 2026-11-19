import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { portalApi, Estimate } from "../../api/portal";
import { formatDate, formatCurrency } from "../../utils/date";

export const EstimateDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
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
  const linkedTaxInvoice = linkedProforma?.tax_invoices && linkedProforma.tax_invoices[0];
  const isConverted = estimate.status === "invoiced" || Boolean(linkedProforma);
  const isPending = !isConverted && estimate.status === "sent";
  const items = estimate.items || [];

  const totalAmountNum = Number(estimate.total_amount || estimate.total || 0);
  const taxAmountNum = Number(estimate.tax_amount || 0);
  const subtotalNum = Number(estimate.subtotal || 0);
  const roundOffNum = Number(estimate.round_off || 0);
  const discountNum = Number(estimate.discount_amount || 0);

  const isInclusive =
    estimate.tax_calculation_type === "inclusive" ||
    (totalAmountNum > 0 && taxAmountNum > 0 && Math.abs(totalAmountNum - subtotalNum) < 1) ||
    (totalAmountNum > 0 && taxAmountNum > 0 && totalAmountNum < (subtotalNum + taxAmountNum - 1));

  const taxableTurnover = isInclusive
    ? Math.max(0, totalAmountNum - roundOffNum - taxAmountNum)
    : subtotalNum - discountNum;

  const timelineItems = [
    {
      key: "estimate",
      title: "Quotation",
      number: estimate.estimate_number,
      date: formatDate(estimate.estimate_date),
      amount: totalAmountNum,
      status: isConverted
        ? "ACCEPTED"
        : estimate.status === "sent"
        ? "AWAITING APPROVAL"
        : estimate.status.toUpperCase(),
      badgeVariant: (isConverted || estimate.status === "accepted"
        ? "success"
        : estimate.status === "declined"
        ? "danger"
        : "warning") as "success" | "warning" | "danger" | "info" | "neutral" | "purple",
      isCurrent: true,
      onPress: undefined,
    },
    ...(linkedProforma
      ? [
          {
            key: "proforma",
            title: "Proforma Invoice",
            number: linkedProforma.proforma_number,
            date: formatDate(linkedProforma.invoice_date),
            amount: Number(linkedProforma.total_amount ?? totalAmountNum),
            status: (linkedProforma.status || "unpaid").toUpperCase(),
            badgeVariant: (linkedProforma.status === "paid"
              ? "success"
              : "warning") as "success" | "warning" | "danger" | "info" | "neutral" | "purple",
            isCurrent: false,
            onPress: () =>
              navigation.navigate("InvoiceDetail", {
                proformaId: linkedProforma.id,
                type: "proforma",
              }),
          },
        ]
      : []),
    ...(linkedTaxInvoice
      ? [
          {
            key: "invoice",
            title: "Tax Invoice",
            number: linkedTaxInvoice.invoice_number,
            date: formatDate(linkedTaxInvoice.invoice_date),
            amount: Number(linkedTaxInvoice.total_amount ?? totalAmountNum),
            status: (linkedTaxInvoice.status || "unpaid").toUpperCase(),
            badgeVariant: (linkedTaxInvoice.status === "paid"
              ? "success"
              : "warning") as "success" | "warning" | "danger" | "info" | "neutral" | "purple",
            isCurrent: false,
            onPress: () =>
              navigation.navigate("InvoiceDetail", {
                invoiceId: linkedTaxInvoice.id,
                type: "tax",
              }),
          },
        ]
      : []),
  ];

  const cleanNotes = estimate.notes
    ?.split("\n")
    .filter(
      (line) =>
        !line.trim().toLowerCase().startsWith("client acceptance:") &&
        !line.trim().toLowerCase().startsWith("client note:")
    )
    .join("\n")
    .trim();

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isPending ? Math.max(insets.bottom, 18) + 84 : 40 },
        ]}
      >
        {/* 1. Hero Valuation Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroDocNumber}>{estimate.estimate_number}</Text>
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
            <View style={{ flex: 1, marginRight: 12 }}>
              {estimate.project?.name ? (
                <Text style={styles.projectText} numberOfLines={1}>
                  Project: {estimate.project.name}
                </Text>
              ) : null}
              <Text style={styles.dateMetaText}>
                Issued: {formatDate(estimate.estimate_date)}
              </Text>
              {estimate.expiry_date ? (
                <Text style={styles.dateMetaSubText}>
                  Valid until: {formatDate(estimate.expiry_date)}
                </Text>
              ) : null}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Badge
              label={isInclusive ? "GST INCLUSIVE" : "TAX EXCLUSIVE"}
              variant={isInclusive ? "purple" : "neutral"}
              size="sm"
            />
            <Badge
              label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
              variant="neutral"
              size="sm"
            />
          </View>
        </View>

        {items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.noItemsText}>No line items listed.</Text>
          </Card>
        ) : (
          items.map((item, idx) => {
            const itemTaxRate = item.tax_rate ?? estimate.tax_rate ?? 18;
            const itemTaxRateNum = Number(itemTaxRate);
            const qtyNum = Number(item.quantity) || 1;
            const unitLabel = item.unit
              ? (qtyNum === 1 && item.unit.toLowerCase() === "units" ? "unit" : item.unit)
              : (qtyNum === 1 ? "unit" : "units");

            const taxLabel =
              itemTaxRateNum === 0
                ? "0% Exempt"
                : isInclusive
                ? `Incl. ${itemTaxRateNum}% GST`
                : `+${itemTaxRateNum}% GST`;

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
                      {qtyNum} {unitLabel} × {formatCurrency(item.unit_price)}
                    </Text>
                    <Text style={styles.itemCalcDot}>•</Text>
                    <Text
                      style={[
                        styles.itemGstText,
                        isInclusive && { color: colors.purple },
                      ]}
                    >
                      {taxLabel}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        {/* 3. Accounting Summary Card */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Summary</Text>

          {isInclusive ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Turnover</Text>
                <Text style={styles.summaryValue}>{formatCurrency(taxableTurnover)}</Text>
              </View>
              {discountNum > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    -{formatCurrency(discountNum)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST Included ({estimate.tax_rate || 18}%)</Text>
                <Text style={[styles.summaryValue, { color: colors.purple }]}>
                  {formatCurrency(taxAmountNum)}
                </Text>
              </View>
            </>
          ) : (
            <>
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
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST ({estimate.tax_rate || 18}%)</Text>
                <Text style={styles.summaryValue}>+{formatCurrency(taxAmountNum)}</Text>
              </View>
            </>
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
        {cleanNotes || estimate.terms_and_conditions ? (
          <Card style={styles.termsCard}>
            <Text style={styles.termsTitle}>Terms & Scope Notes</Text>
            {cleanNotes ? (
              <Text style={styles.termsText}>{cleanNotes}</Text>
            ) : null}
            {estimate.terms_and_conditions ? (
              <Text style={[styles.termsText, cleanNotes ? { marginTop: 6 } : null]}>
                {estimate.terms_and_conditions}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {/* 4. Commercial Document Lifecycle Timeline (History Only) */}
        {timelineItems.length > 1 && (
          <Card style={styles.timelineCard}>
            <View style={styles.timelineHeaderRow}>
              <Text style={styles.timelineTitle}>Commercial Progression</Text>
              <Badge
                label={`${timelineItems.length} records`}
                variant="neutral"
                size="sm"
              />
            </View>

            <View style={styles.timelineList}>
              {timelineItems.map((item, index) => {
                const isLast = index === timelineItems.length - 1;
                return (
                  <View key={item.key} style={styles.timelineRow}>
                    {/* Left Column: Node dot & vertical line */}
                    <View style={styles.nodeColumn}>
                      <View
                        style={[
                          styles.timelineDot,
                          item.isCurrent ? styles.dotCurrent : styles.dotCompleted,
                        ]}
                      >
                        <View
                          style={[
                            styles.timelineDotInner,
                            item.isCurrent ? styles.dotInnerCurrent : styles.dotInnerCompleted,
                          ]}
                        />
                      </View>
                      {!isLast && <View style={styles.verticalLine} />}
                    </View>

                    {/* Right Column: Record Details */}
                    <TouchableOpacity
                      style={[styles.timelineContentBox, isLast && { marginBottom: 0 }]}
                      onPress={item.onPress}
                      disabled={!item.onPress}
                      activeOpacity={item.onPress ? 0.7 : 1}
                    >
                      <View style={styles.timelineCardHeader}>
                        <View style={styles.timelineTitleGroup}>
                          <Text style={styles.timelineItemTitle} numberOfLines={1}>{item.title}</Text>
                          <Badge
                            label={(item.status || "").replace(/_/g, " ")}
                            variant={item.badgeVariant as any}
                            size="sm"
                          />
                        </View>
                        <Text style={styles.timelineAmount}>{formatCurrency(item.amount)}</Text>
                      </View>

                      <View style={styles.timelineCardMeta}>
                        <Text style={styles.timelineItemNumber} numberOfLines={1}>
                          {item.number} • {item.date}
                        </Text>
                        {item.isCurrent ? (
                          <View style={styles.currentViewingPill}>
                            <Text style={styles.currentViewingText}>Viewing</Text>
                          </View>
                        ) : item.onPress ? (
                          <View style={styles.viewRow}>
                            <Text style={styles.viewText}>View</Text>
                            <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Floating Compact Decision Dock (When awaiting approval) */}
      {isPending && (
        <View
          style={[
            styles.floatingDecisionBar,
            { paddingBottom: Math.max(insets.bottom, 18) + 6 },
          ]}
        >
          <View style={styles.floatingPriceBox}>
            <Text style={styles.floatingPriceLabel}>TOTAL PROPOSAL</Text>
            <Text style={styles.floatingPriceValue}>{formatCurrency(totalAmountNum)}</Text>
          </View>

          <View style={styles.floatingBtnGroup}>
            <TouchableOpacity
              style={styles.floatingDeclineBtn}
              onPress={() => handleRespond("declined")}
              disabled={acting}
              activeOpacity={0.7}
            >
              <Text style={styles.floatingDeclineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingAcceptBtn}
              onPress={() => handleRespond("accepted")}
              disabled={acting}
              activeOpacity={0.8}
            >
              {acting ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={15} color={colors.textLight} />
                  <Text style={styles.floatingAcceptText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  dateMetaSubText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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

  // 4. Commercial Timeline Card
  timelineCard: {
    marginTop: 2,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  timelineList: {
    marginTop: 2,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  nodeColumn: {
    width: 24,
    alignItems: "center",
    marginRight: 8,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  dotCurrent: {
    borderColor: colors.primary,
  },
  dotCompleted: {
    borderColor: colors.success,
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotInnerCurrent: {
    backgroundColor: colors.primary,
  },
  dotInnerCompleted: {
    backgroundColor: colors.success,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borderLight,
    marginVertical: 3,
  },
  timelineContentBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  timelineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  timelineTitleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginRight: 10,
  },
  timelineItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  timelineAmount: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    textAlign: "right",
    flexShrink: 0,
  },
  timelineCardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineItemNumber: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 8,
  },
  currentViewingPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  currentViewingText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.primary,
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  viewText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primary,
  },

  // 5. Compact Floating Decision Dock
  floatingDecisionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingPriceBox: {
    justifyContent: "center",
  },
  floatingPriceLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  floatingPriceValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.3,
  },
  floatingBtnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  floatingDeclineBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingDeclineText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
  },
  floatingAcceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 5,
    justifyContent: "center",
  },
  floatingAcceptText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.textLight,
  },
});
