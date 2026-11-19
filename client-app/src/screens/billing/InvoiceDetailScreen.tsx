import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { portalApi, Invoice, ProformaInvoice, ReceiptVoucher, InvoiceItem } from "../../api/portal";
import { formatDate, formatCurrency } from "../../utils/date";

export const InvoiceDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { invoiceId, proformaId, voucherId, type = "tax" } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
  const [voucher, setVoucher] = useState<ReceiptVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isVoucher = type === "voucher" || Boolean(voucherId);
  const isProforma = !isVoucher && (type === "proforma" || Boolean(proformaId));

  const fetchDetail = async () => {
    try {
      setLoading(true);
      if (isVoucher) {
        const id = voucherId || invoiceId;
        const res = await portalApi.getReceiptVoucher(id);
        setVoucher(res.receipt_voucher);
      } else if (isProforma) {
        const id = proformaId || invoiceId;
        const res = await portalApi.getProformaInvoice(id);
        setProforma(res.proforma_invoice);
      } else {
        const res = await portalApi.getInvoice(invoiceId);
        setInvoice(res.invoice);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load document details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [invoiceId, proformaId, voucherId, isVoucher, isProforma]);

  const handlePay = async () => {
    if (!invoice) return;
    try {
      setPaying(true);
      const res = await portalApi.getPaymentLink(invoice.id);
      if (res.success && res.payment_link?.link_url) {
        await WebBrowser.openBrowserAsync(res.payment_link.link_url);
        fetchDetail();
      } else {
        Alert.alert("Notice", "Payment gateway is not configured for this invoice yet.");
      }
    } catch (err: any) {
      Alert.alert("Payment Error", err.message || "Failed to initiate payment gateway.");
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      if (isVoucher && voucher) {
        const res = await portalApi.getReceiptVoucherPdfUrl(voucher.id);
        if (res.download_url) {
          await WebBrowser.openBrowserAsync(res.download_url);
        } else {
          Alert.alert("Notice", "Official Receipt Voucher PDF is currently unavailable.");
        }
      } else if (isProforma && proforma) {
        const res = await portalApi.getProformaPdfUrl(proforma.id);
        if (res.download_url) {
          await WebBrowser.openBrowserAsync(res.download_url);
        } else {
          Alert.alert("Notice", "Official Proforma PDF is currently unavailable.");
        }
      } else if (invoice) {
        const res = await portalApi.getInvoicePdfUrl(invoice.id);
        if (res.download_url) {
          await WebBrowser.openBrowserAsync(res.download_url);
        } else {
          Alert.alert("Notice", "Official Tax Invoice PDF is currently unavailable.");
        }
      }
    } catch (err: any) {
      Alert.alert("Download Error", err.message || "Failed to download official PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {isVoucher
            ? "Loading receipt voucher..."
            : isProforma
            ? "Loading proforma invoice..."
            : "Loading tax invoice..."}
        </Text>
      </View>
    );
  }

  // Draft Isolation Protection
  if (isProforma && proforma?.status === "draft") {
    return (
      <View style={[styles.centerContainer, { padding: 24 }]}>
        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 14 }}>
          Proforma In Preparation
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          Your account manager is currently preparing this proforma invoice. It will be available here once officially issued.
        </Text>
        <Button
          title="Return to Invoices"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (!isProforma && invoice?.status === "draft") {
    return (
      <View style={[styles.centerContainer, { padding: 24 }]}>
        <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 14 }}>
          Invoice In Preparation
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          This tax invoice is currently being drafted by the accounts division. It will appear once certified and issued.
        </Text>
        <Button
          title="Return to Invoices"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Receipt Voucher View (Section 31(3)(d) & Rule 50)
  if (isVoucher && voucher) {
    const totalAdvance = Number(voucher.amount_received || voucher.total_amount || 0);
    const taxableAmount = Number(voucher.taxable_amount || 0);
    const taxAmount = Number(voucher.tax_amount || 0);
    const cgstAmount = Number(voucher.cgst_amount || 0);
    const sgstAmount = Number(voucher.sgst_amount || 0);
    const igstAmount = Number(voucher.igst_amount || 0);
    const adjustedAmount = Number(voucher.adjusted_amount || 0);
    const remainingAdvance = Number(
      voucher.remaining_advance ?? voucher.remaining_amount ?? (totalAdvance - adjustedAmount)
    );

    const isFullyAdjusted = voucher.status === "fully_adjusted" || remainingAdvance <= 0;
    const isPartiallyAdjusted =
      voucher.status === "partially_adjusted" || (adjustedAmount > 0 && remainingAdvance > 0);

    const voucherTimelineItems = [
      ...(voucher.estimate
        ? [
            {
              key: "estimate",
              title: "Quotation",
              number: voucher.estimate.estimate_number,
              date: formatDate(voucher.estimate.estimate_date || voucher.voucher_date),
              amount: Number(voucher.estimate.total_amount ?? totalAdvance),
              status: "ACCEPTED",
              badgeVariant: "success" as const,
              isCurrent: false,
              onPress: () =>
                navigation.navigate("EstimateDetail", {
                  estimateId: voucher.estimate!.id,
                }),
            },
          ]
        : []),
      {
        key: "voucher",
        title: "Receipt Voucher",
        number: voucher.voucher_number,
        date: formatDate(voucher.voucher_date),
        amount: totalAdvance,
        status: isFullyAdjusted
          ? "ADJUSTED"
          : isPartiallyAdjusted
          ? "PARTIAL"
          : voucher.status.toUpperCase(),
        badgeVariant: isFullyAdjusted ? ("neutral" as const) : ("purple" as const),
        isCurrent: true,
        onPress: undefined,
      },
      ...((voucher.invoice_advance_adjustments || []).map((adj) => ({
        key: `invoice-${adj.invoice_id}`,
        title: "Tax Invoice",
        number: adj.invoice?.invoice_number || `INV #${adj.invoice_id}`,
        date: formatDate(adj.invoice?.invoice_date || voucher.voucher_date),
        amount: Number(adj.invoice?.total_amount || adj.adjusted_amount),
        status: "ADJUSTED",
        badgeVariant: "success" as const,
        isCurrent: false,
        onPress: adj.invoice
          ? () =>
              navigation.navigate("InvoiceDetail", {
                invoiceId: adj.invoice_id,
                type: "tax",
              })
          : undefined,
      }))),
    ];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.invoiceNumber}>{voucher.voucher_number}</Text>
              <Text style={styles.dateText}>Issued on: {formatDate(voucher.voucher_date)}</Text>
              <Text style={styles.dateText}>Rule 50 Advance Receipt</Text>
            </View>
            <Badge
              label={
                isFullyAdjusted
                  ? "ADJUSTED"
                  : isPartiallyAdjusted
                  ? "PARTIALLY ADJUSTED"
                  : voucher.status.toUpperCase()
              }
              variant={isFullyAdjusted ? "neutral" : "purple"}
            />
          </View>

          <View style={styles.advanceRow}>
            <View>
              <Text style={styles.dueLabel}>Advance Received</Text>
              <Text style={styles.dueAmount}>{formatCurrency(totalAdvance)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dueLabel}>Unadjusted Balance</Text>
              <Text style={[styles.dueAmount, { color: colors.purple }]}>
                {formatCurrency(remainingAdvance)}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
            <Button
              title="Download Receipt Voucher"
              variant="outline"
              onPress={handleDownloadPdf}
              loading={downloadingPdf}
              icon={<Ionicons name="cloud-download-outline" size={16} color={colors.primary} />}
            />
          </View>
        </Card>

        {/* Advance Tax & GST Schedule */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>GST Advance Schedule (Table 11A)</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Advance Received</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalAdvance)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxable Turnover Base</Text>
            <Text style={styles.summaryValue}>{formatCurrency(taxableAmount)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Applicable GST Rate</Text>
            <Text style={styles.summaryValue}>{voucher.tax_rate}%</Text>
          </View>

          {voucher.is_inter_state ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IGST (Integrated Tax)</Text>
              <Text style={[styles.summaryValue, { color: colors.purple }]}>
                {formatCurrency(igstAmount)}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST (Central Tax - {voucher.tax_rate / 2}%)</Text>
                <Text style={[styles.summaryValue, { color: colors.purple }]}>
                  {formatCurrency(cgstAmount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST (State Tax - {voucher.tax_rate / 2}%)</Text>
                <Text style={[styles.summaryValue, { color: colors.purple }]}>
                  {formatCurrency(sgstAmount)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Place of Supply</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>{voucher.place_of_supply || "Assam (18)"}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Mode</Text>
            <Text style={styles.summaryValue}>{(voucher.payment_mode || "Bank Transfer").replace("_", " ").toUpperCase()}</Text>
          </View>

          {voucher.payment_reference ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transaction Ref</Text>
              <Text style={styles.summaryValue}>{voucher.payment_reference}</Text>
            </View>
          ) : null}
        </Card>

        {/* Commercial Progression Timeline */}
        {voucherTimelineItems.length > 1 && (
          <Card style={styles.timelineCard}>
            <View style={styles.timelineHeaderRow}>
              <Text style={styles.timelineTitle}>Commercial Progression</Text>
              <Badge label={`${voucherTimelineItems.length} records`} variant="neutral" size="sm" />
            </View>

            <View style={styles.timelineList}>
              {voucherTimelineItems.map((item, index) => {
                const isLast = index === voucherTimelineItems.length - 1;
                return (
                  <View key={item.key} style={styles.timelineRow}>
                    <View style={styles.nodeColumn}>
                      <View style={[styles.timelineDot, item.isCurrent ? styles.dotCurrent : styles.dotCompleted]}>
                        <View style={[styles.timelineDotInner, item.isCurrent ? styles.dotInnerCurrent : styles.dotInnerCompleted]} />
                      </View>
                      {!isLast && <View style={styles.verticalLine} />}
                    </View>

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
    );
  }

  // Proforma View
  if (isProforma && proforma) {
    const linkedTaxInvoices = proforma.tax_invoices || [];
    const isConverted =
      proforma.status === "converted" ||
      proforma.status === "fully_invoiced" ||
      linkedTaxInvoices.length > 0;
    const items = proforma.items || [];

    const totalAmountNum = Number(proforma.total_amount || 0);
    const taxAmountNum = Number(proforma.tax_amount || 0);
    const subtotalNum = Number(proforma.subtotal || 0);
    const roundOffNum = Number(proforma.round_off || 0);
    const discountNum = Number(proforma.discount_amount || 0);
    const docTaxRate = Number(proforma.tax_rate ?? 18);
    const expectedInclusiveDocTax =
      docTaxRate > 0
        ? Math.round((totalAmountNum - totalAmountNum / (1 + docTaxRate / 100)) * 100) / 100
        : 0;

    const isInclusive =
      proforma.tax_calculation_type === "inclusive" ||
      proforma.estimate?.tax_calculation_type === "inclusive" ||
      (taxAmountNum > 0 && Math.abs(taxAmountNum - expectedInclusiveDocTax) < 1) ||
      (totalAmountNum > 0 && taxAmountNum > 0 && Math.abs(totalAmountNum - subtotalNum) < 1) ||
      (totalAmountNum > 0 && taxAmountNum > 0 && totalAmountNum < (subtotalNum + taxAmountNum - 1));

    const taxableTurnover = isInclusive
      ? Math.max(0, totalAmountNum - roundOffNum - taxAmountNum)
      : subtotalNum - discountNum;

    // Progression history for bottom timeline
    const proformaTimelineItems = [
      ...(proforma.estimate
        ? [
            {
              key: "estimate",
              title: "Quotation",
              number: proforma.estimate.estimate_number,
              date: formatDate(proforma.estimate.estimate_date || proforma.invoice_date),
              amount: Number(proforma.estimate.total_amount ?? totalAmountNum),
              status: "ACCEPTED",
              badgeVariant: "success" as const,
              isCurrent: false,
              onPress: () =>
                navigation.navigate("EstimateDetail", {
                  estimateId: proforma.estimate!.id,
                }),
            },
          ]
        : []),
      {
        key: "proforma",
        title: "Proforma Invoice",
        number: proforma.proforma_number,
        date: formatDate(proforma.invoice_date),
        amount: totalAmountNum,
        status: (isConverted
          ? "INVOICED"
          : proforma.status === "paid"
          ? "PAID"
          : (proforma.status || "unpaid").replace(/_/g, " ").toUpperCase()) as string,
        badgeVariant: (isConverted
          ? "purple"
          : proforma.status === "paid"
          ? "success"
          : "info") as any,
        isCurrent: true,
        onPress: undefined,
      },
      ...linkedTaxInvoices.map((inv) => ({
        key: `invoice-${inv.id}`,
        title: "Tax Invoice",
        number: inv.invoice_number,
        date: formatDate(inv.invoice_date),
        amount: Number(inv.total_amount || 0),
        status: (inv.status || "unpaid").toUpperCase(),
        badgeVariant: (inv.status === "paid"
          ? "success"
          : inv.status === "overdue"
          ? "danger"
          : "warning") as any,
        isCurrent: false,
        onPress: () =>
          navigation.navigate("InvoiceDetail", {
            invoiceId: inv.id,
            type: "tax",
          }),
      })),
    ];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Card (Directly at Top) */}
        <Card style={styles.statusCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.invoiceNumber}>{proforma.proforma_number}</Text>
              <Text style={styles.dateText}>Issued on: {formatDate(proforma.invoice_date)}</Text>
              <Text style={styles.dateText}>Payment Due: {formatDate(proforma.due_date) || "Upon receipt"}</Text>
            </View>
            <Badge
              label={
                isConverted
                  ? "INVOICED"
                  : (proforma.status || "pending").replace("_", " ").toUpperCase()
              }
              variant={isConverted ? "purple" : proforma.status === "paid" ? "success" : "info"}
            />
          </View>

          <View style={styles.advanceRow}>
            <View>
              <Text style={styles.dueLabel}>Total Amount</Text>
              <Text style={styles.dueAmount}>{formatCurrency(totalAmountNum)}</Text>
            </View>
            {proforma.paid_amount ? (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.dueLabel}>Amount Paid</Text>
                <Text style={[styles.dueAmount, { color: colors.success }]}>
                  {formatCurrency(proforma.paid_amount)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Download Official PDF Action */}
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
            <Button
              title="Download Proforma Invoice"
              variant="outline"
              onPress={handleDownloadPdf}
              loading={downloadingPdf}
              icon={<Ionicons name="cloud-download-outline" size={16} color={colors.primary} />}
            />
          </View>
        </Card>

        {/* Deliverables & Line Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Scope Deliverables Schedule</Text>
          <Badge
            label={isInclusive ? "GST INCLUSIVE" : "TAX EXCLUSIVE"}
            variant={isInclusive ? "purple" : "neutral"}
            size="sm"
          />
        </View>

        {items.length === 0 ? (
          <Card>
            <Text style={styles.noItemsText}>Standard milestone deliverables schedule</Text>
          </Card>
        ) : (
          items.map((item, idx) => {
            const qtyNum = Number(item.quantity) || 1;
            const unitPriceNum = Number(item.unit_price) || 0;
            const rawAmount = Number(item.amount || qtyNum * unitPriceNum);
            const itemTaxRate =
              item.tax_rate !== null && item.tax_rate !== undefined
                ? Number(item.tax_rate)
                : docTaxRate;

            const expectedInclusiveTax =
              itemTaxRate > 0
                ? Math.round((rawAmount - rawAmount / (1 + itemTaxRate / 100)) * 100) / 100
                : 0;
            const itemMatchesInclusive =
              item.tax_amount !== null &&
              item.tax_amount !== undefined &&
              Math.abs(Number(item.tax_amount) - expectedInclusiveTax) < 1;

            const lineIsInclusive = isInclusive || itemMatchesInclusive;

            let lineGross: number;
            let lineTaxable: number;
            let lineTax: number;

            if (lineIsInclusive) {
              lineGross = rawAmount; // ₹25,000.00
              lineTaxable =
                itemTaxRate > 0
                  ? Math.round((lineGross / (1 + itemTaxRate / 100)) * 100) / 100
                  : lineGross;
              lineTax = Math.round((lineGross - lineTaxable) * 100) / 100;
            } else {
              lineTaxable = rawAmount;
              lineTax = Number(
                item.tax_amount || Math.round(((lineTaxable * itemTaxRate) / 100) * 100) / 100
              );
              lineGross = lineTaxable + lineTax;
            }

            const unitLabel = item.unit
              ? qtyNum === 1 && item.unit.toLowerCase() === "units"
                ? "unit"
                : item.unit
              : qtyNum === 1
              ? "unit"
              : "units";

            const taxLabel =
              itemTaxRate === 0
                ? "0% Exempt"
                : lineIsInclusive
                ? `Incl. ${itemTaxRate}% GST`
                : `+${itemTaxRate}% GST`;

            const hasDistinctTitle = Boolean(
              item.item_name && item.description && item.description !== item.item_name
            );
            const lineTitle = item.item_name || item.description || `Item #${idx + 1}`;

            return (
              <Card key={item.id || idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{lineTitle}</Text>
                {hasDistinctTitle && (
                  <Text style={styles.itemSubDesc}>{item.description}</Text>
                )}
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemQty}>
                    {qtyNum} {unitLabel} × {formatCurrency(unitPriceNum)}
                  </Text>
                  <View style={[styles.gstBadge, isInclusive && styles.gstBadgeInclusive]}>
                    <Text style={[styles.gstBadgeText, isInclusive && styles.gstBadgeTextInclusive]}>
                      {taxLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemDivider} />
                <View style={styles.itemFooterRow}>
                  <Text style={styles.itemTaxable}>
                    Taxable: {formatCurrency(lineTaxable)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    Gross: {formatCurrency(lineGross)}
                  </Text>
                </View>
              </Card>
            );
          })
        )}

        {/* Accounting Summary */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Advance Billing Summary</Text>

          {isInclusive ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Turnover</Text>
                <Text style={styles.summaryValue}>{formatCurrency(taxableTurnover)}</Text>
              </View>
              {discountNum > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: colors.danger }]}>
                    -{formatCurrency(discountNum)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST Included ({docTaxRate}%)</Text>
                <Text style={[styles.summaryValue, { color: colors.purple }]}>
                  {formatCurrency(taxAmountNum)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal (Taxable)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(subtotalNum)}</Text>
              </View>
              {discountNum > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: colors.danger }]}>
                    -{formatCurrency(discountNum)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST Component (+{docTaxRate}%)</Text>
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
            <Text style={styles.grossLabel}>Total Proforma Value</Text>
            <Text style={styles.grossValue}>{formatCurrency(totalAmountNum)}</Text>
          </View>
        </Card>

        {/* Advance Receipts Section (Statutory GST Receipt Vouchers) */}
        {proforma.receipt_vouchers && proforma.receipt_vouchers.length > 0 && (
          <Card style={styles.taxInvCard}>
            <View style={styles.taxInvCardHeader}>
              <View style={styles.taxInvIconBg}>
                <Ionicons name="shield-checkmark" size={18} color="#7E22CE" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.taxInvCardTitle}>Advance Receipts (Receipt Vouchers)</Text>
                <Text style={styles.taxInvCardSub}>
                  {proforma.receipt_vouchers.length} {proforma.receipt_vouchers.length === 1 ? "voucher" : "vouchers"} issued against this proforma
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {proforma.receipt_vouchers.map((rv) => (
                <TouchableOpacity
                  key={`rv-card-${rv.id}`}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E9D5FF",
                  }}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate("InvoiceDetail", {
                      voucherId: rv.id,
                      type: "voucher",
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.text }}>
                        {rv.voucher_number}
                      </Text>
                      <Badge
                        label={(rv.status || "active").toUpperCase()}
                        variant="purple"
                        size="sm"
                      />
                    </View>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      Received {formatDate(rv.voucher_date)} • {rv.payment_mode ? rv.payment_mode.replace("_", " ").toUpperCase() : "Advance"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#6B21A8" }}>
                      {formatCurrency(Number(rv.amount_received || rv.total_amount || 0))}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}>
                      <Text style={{ fontSize: 10, color: colors.primary, fontFamily: fonts.medium }}>
                        View
                      </Text>
                      <Ionicons name="chevron-forward" size={10} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Commercial Progression Timeline (History Only) */}
        {proformaTimelineItems.length > 1 && (
          <Card style={styles.timelineCard}>
            <View style={styles.timelineHeaderRow}>
              <Text style={styles.timelineTitle}>Commercial Progression</Text>
              <Badge label={`${proformaTimelineItems.length} records`} variant="neutral" size="sm" />
            </View>

            <View style={styles.timelineList}>
              {proformaTimelineItems.map((item, index) => {
                const isLast = index === proformaTimelineItems.length - 1;
                return (
                  <View key={item.key} style={styles.timelineRow}>
                    <View style={styles.nodeColumn}>
                      <View style={[styles.timelineDot, item.isCurrent ? styles.dotCurrent : styles.dotCompleted]}>
                        <View style={[styles.timelineDotInner, item.isCurrent ? styles.dotInnerCurrent : styles.dotInnerCompleted]} />
                      </View>
                      {!isLast && <View style={styles.verticalLine} />}
                    </View>

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
    );
  }

  // Tax Invoice View
  if (!invoice) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noItemsText}>Invoice not found.</Text>
      </View>
    );
  }

  const isPaid = invoice.status === "paid";
  const items = invoice.items || [];

  const invoiceTotalNum = Number(invoice.total_amount ?? invoice.total ?? 0);
  const taxAmountNum = Number(invoice.tax_amount || 0);
  const subtotalNum = Number(invoice.subtotal || 0);
  const roundOffNum = Number(invoice.round_off || 0);
  const discountNum = Number(invoice.discount_amount || 0);
  const docTaxRate = Number(invoice.tax_rate ?? 18);
  const advanceAdjustedNum = Number(invoice.advance_adjusted || 0);

  const expectedInclusiveDocTax =
    docTaxRate > 0
      ? Math.round((invoiceTotalNum - invoiceTotalNum / (1 + docTaxRate / 100)) * 100) / 100
      : 0;

  const isInclusive =
    invoice.tax_calculation_type === "inclusive" ||
    invoice.proforma_invoice?.tax_calculation_type === "inclusive" ||
    invoice.estimate?.tax_calculation_type === "inclusive" ||
    (taxAmountNum > 0 && Math.abs(taxAmountNum - expectedInclusiveDocTax) < 1) ||
    (invoiceTotalNum > 0 && taxAmountNum > 0 && Math.abs(invoiceTotalNum - subtotalNum) < 1) ||
    (invoiceTotalNum > 0 && taxAmountNum > 0 && invoiceTotalNum < (subtotalNum + taxAmountNum - 1));

  const taxableTurnover = isInclusive
    ? Math.max(0, invoiceTotalNum - roundOffNum - taxAmountNum)
    : subtotalNum - discountNum;

  const originEstimate = invoice.estimate || invoice.proforma_invoice?.estimate;
  const taxInvoiceTimelineItems = [
    ...(originEstimate
      ? [
          {
            key: "estimate",
            title: "Quotation",
            number: originEstimate.estimate_number,
            date: formatDate(originEstimate.estimate_date || invoice.invoice_date),
            amount: Number(originEstimate.total_amount ?? invoiceTotalNum),
            status: "ACCEPTED",
            badgeVariant: "success" as const,
            isCurrent: false,
            onPress: () =>
              navigation.navigate("EstimateDetail", {
                estimateId: originEstimate.id,
              }),
          },
        ]
      : []),
    ...(invoice.advance_adjustments || []).map((adj) => ({
      key: `rv-${adj.receipt_voucher?.id || adj.id}`,
      title: "Receipt Voucher",
      number: adj.receipt_voucher?.voucher_number || "Advance RV",
      date: formatDate(adj.receipt_voucher?.voucher_date || invoice.invoice_date),
      amount: Number(adj.adjusted_amount || adj.receipt_voucher?.total_amount || 0),
      status: "ADJUSTED",
      badgeVariant: "purple" as const,
      isCurrent: false,
      onPress: adj.receipt_voucher
        ? () =>
            navigation.navigate("InvoiceDetail", {
              voucherId: adj.receipt_voucher!.id,
              type: "voucher",
            })
        : undefined,
    })),
    ...(invoice.proforma_invoice
      ? [
          {
            key: "proforma",
            title: "Proforma Invoice",
            number: invoice.proforma_invoice.proforma_number,
            date: formatDate(invoice.proforma_invoice.invoice_date || invoice.invoice_date),
            amount: Number(invoice.proforma_invoice.total_amount ?? invoiceTotalNum),
            status: (invoice.proforma_invoice.status || "unpaid").toUpperCase(),
            badgeVariant: (invoice.proforma_invoice.status === "paid" ? "success" : "purple") as any,
            isCurrent: false,
            onPress: () =>
              navigation.navigate("InvoiceDetail", {
                proformaId: invoice.proforma_invoice!.id,
                type: "proforma",
              }),
          },
        ]
      : []),
    {
      key: "invoice",
      title: "Tax Invoice",
      number: invoice.invoice_number,
      date: formatDate(invoice.invoice_date),
      amount: invoiceTotalNum,
      status: (isPaid ? "PAID" : invoice.status || "UNPAID").toUpperCase(),
      badgeVariant: (isPaid ? "success" : invoice.status === "overdue" ? "danger" : "warning") as any,
      isCurrent: true,
      onPress: undefined,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Status Card (Directly at Top) */}
      <Card style={styles.statusCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.dateText}>Issued on: {formatDate(invoice.invoice_date)}</Text>
            <Text style={styles.dateText}>Payment Due: {formatDate(invoice.due_date) || "Upon receipt"}</Text>
          </View>
          <Badge
            label={isPaid ? "PAID" : (invoice.status || "unpaid").toUpperCase()}
            variant={isPaid ? "success" : invoice.status === "overdue" ? "danger" : "warning"}
          />
        </View>

        {isPaid ? (
          <View style={styles.settledBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.settledText}>
              Payment Completed
            </Text>
          </View>
        ) : (
          <View style={styles.payBox}>
            <View>
              <Text style={styles.dueLabel}>Total Amount Due</Text>
              <Text style={styles.dueAmount}>{formatCurrency(invoiceTotalNum)}</Text>
            </View>
            <Button
              title="Pay Now"
              onPress={handlePay}
              loading={paying}
              icon={<Ionicons name="card-outline" size={16} color={colors.textLight} />}
              style={styles.payNowBtn}
            />
          </View>
        )}

        {/* Download Official PDF Action */}
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          <Button
            title="Download Tax Invoice"
            variant="outline"
            onPress={handleDownloadPdf}
            loading={downloadingPdf}
            icon={<Ionicons name="cloud-download-outline" size={16} color={colors.primary} />}
          />
        </View>
      </Card>

      {/* Deliverables & Line Items Ledger */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scope Deliverables & Line Items</Text>
        <Badge
          label={isInclusive ? "GST INCLUSIVE" : "TAX EXCLUSIVE"}
          variant={isInclusive ? "purple" : "neutral"}
          size="sm"
        />
      </View>

      {items.length === 0 ? (
        <Card>
          <Text style={styles.noItemsText}>Standard milestone deliverables schedule</Text>
        </Card>
      ) : (
        items.map((item, idx) => {
          const qtyNum = Number(item.quantity) || 1;
          const unitPriceNum = Number(item.unit_price) || 0;
          const rawAmount = Number(item.amount || qtyNum * unitPriceNum);
          const itemTaxRate =
            item.tax_rate !== null && item.tax_rate !== undefined
              ? Number(item.tax_rate)
              : docTaxRate;

          const expectedInclusiveTax =
            itemTaxRate > 0
              ? Math.round((rawAmount - rawAmount / (1 + itemTaxRate / 100)) * 100) / 100
              : 0;
          const itemMatchesInclusive =
            item.tax_amount !== null &&
            item.tax_amount !== undefined &&
            Math.abs(Number(item.tax_amount) - expectedInclusiveTax) < 1;

          const lineIsInclusive = isInclusive || itemMatchesInclusive;

          let lineGross: number;
          let lineTaxable: number;
          let lineTax: number;

          if (lineIsInclusive) {
            lineGross = rawAmount;
            lineTaxable =
              itemTaxRate > 0
                ? Math.round((lineGross / (1 + itemTaxRate / 100)) * 100) / 100
                : lineGross;
            lineTax = Math.round((lineGross - lineTaxable) * 100) / 100;
          } else {
            lineTaxable = rawAmount;
            lineTax = Number(
              item.tax_amount || Math.round(((lineTaxable * itemTaxRate) / 100) * 100) / 100
            );
            lineGross = lineTaxable + lineTax;
          }

          const unitLabel = item.unit
            ? qtyNum === 1 && item.unit.toLowerCase() === "units"
              ? "unit"
              : item.unit
            : qtyNum === 1
            ? "unit"
            : "units";

          const taxLabel =
            itemTaxRate === 0
              ? "0% Exempt"
              : lineIsInclusive
              ? `Incl. ${itemTaxRate}% GST`
              : `+${itemTaxRate}% GST`;

          const hasDistinctTitle = Boolean(
            item.item_name && item.description && item.description !== item.item_name
          );
          const lineTitle = item.item_name || item.description || `Item #${idx + 1}`;

          return (
            <Card key={item.id || idx} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{lineTitle}</Text>
              {hasDistinctTitle && (
                <Text style={styles.itemSubDesc}>{item.description}</Text>
              )}
              
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemQty}>
                  {qtyNum} {unitLabel} × {formatCurrency(unitPriceNum)}
                </Text>
                <View style={[styles.gstBadge, isInclusive && styles.gstBadgeInclusive]}>
                  <Text style={[styles.gstBadgeText, isInclusive && styles.gstBadgeTextInclusive]}>
                    {taxLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.itemFooterRow}>
                <Text style={styles.itemTaxable}>
                  Taxable: {formatCurrency(lineTaxable)}
                </Text>
                <Text style={styles.itemTotal}>
                  Gross: {formatCurrency(lineGross)}
                </Text>
              </View>
            </Card>
          );
        })
      )}

      {/* Financial Breakdown Card */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Accounting Summary</Text>
        
        {isInclusive ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Turnover</Text>
              <Text style={styles.summaryValue}>{formatCurrency(taxableTurnover)}</Text>
            </View>
            {discountNum > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  -{formatCurrency(discountNum)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST Included ({docTaxRate}%)</Text>
              <Text style={[styles.summaryValue, { color: colors.purple }]}>
                {formatCurrency(taxAmountNum)}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (Taxable)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotalNum)}</Text>
            </View>
            {discountNum > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  -{formatCurrency(discountNum)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST Component (+{docTaxRate}%)</Text>
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

        {advanceAdjustedNum > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.success }]}>
              Less: Advance Adjusted (Rule 46 & Table 11B)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              -{formatCurrency(advanceAdjustedNum)}
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.grossLabel}>
            {advanceAdjustedNum > 0 ? "Net Balance Due" : "Total Payable (INR)"}
          </Text>
          <Text style={styles.grossValue}>
            {formatCurrency(
              Number(invoice.due_amount ?? (invoiceTotalNum - advanceAdjustedNum))
            )}
          </Text>
        </View>
      </Card>

      {/* Commercial Progression Timeline (History Only) */}
      {taxInvoiceTimelineItems.length > 1 && (
        <Card style={styles.timelineCard}>
          <View style={styles.timelineHeaderRow}>
            <Text style={styles.timelineTitle}>Commercial Progression</Text>
            <Badge label={`${taxInvoiceTimelineItems.length} records`} variant="neutral" size="sm" />
          </View>

          <View style={styles.timelineList}>
            {taxInvoiceTimelineItems.map((item, index) => {
              const isLast = index === taxInvoiceTimelineItems.length - 1;
              return (
                <View key={item.key} style={styles.timelineRow}>
                  <View style={styles.nodeColumn}>
                    <View style={[styles.timelineDot, item.isCurrent ? styles.dotCurrent : styles.dotCompleted]}>
                      <View style={[styles.timelineDotInner, item.isCurrent ? styles.dotInnerCurrent : styles.dotInnerCompleted]} />
                    </View>
                    {!isLast && <View style={styles.verticalLine} />}
                  </View>

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
  proformaBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.purpleBg,
    borderColor: colors.purpleBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    gap: 8,
  },
  proformaBannerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.purple,
    flex: 1,
  },
  statusCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceNumber: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  advanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dueLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  dueAmount: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  payNowBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  itemCard: {
    marginBottom: 10,
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  itemSubDesc: {
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
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
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
  },
  gstBadgeInclusive: {
    backgroundColor: "#F3E8FF",
  },
  gstBadgeTextInclusive: {
    color: "#7E22CE",
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
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  itemTotal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  noItemsText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  breakdownCard: {
    marginTop: 12,
    backgroundColor: colors.card,
  },
  breakdownTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
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
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  grossLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  grossValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  taxInvCard: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    marginBottom: 16,
    padding: 14,
  },
  taxInvCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  taxInvIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  taxInvCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#6B21A8",
  },
  taxInvCardSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7E22CE",
    marginTop: 2,
  },
  originCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    padding: 12,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  originTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
  },
  originSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  originBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  settledBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  settledText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#166534",
  },
  timelineCard: {
    marginTop: 14,
    backgroundColor: colors.card,
    padding: 14,
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
});
