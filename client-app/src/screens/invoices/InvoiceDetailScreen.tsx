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
import { portalApi, Invoice, ProformaInvoice, InvoiceItem } from "../../api/portal";
import { formatDate, formatCurrency } from "../../utils/date";

export const InvoiceDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { invoiceId, proformaId, type = "tax" } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isProforma = type === "proforma" || Boolean(proformaId);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      if (isProforma) {
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
  }, [invoiceId, proformaId, isProforma]);

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
      if (isProforma && proforma) {
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
          {isProforma ? "Loading proforma invoice..." : "Loading tax invoice..."}
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

  // Proforma View
  if (isProforma && proforma) {
    const linkedTaxInvoices = proforma.tax_invoices || [];
    const latestTaxInv = linkedTaxInvoices[0];
    const isConverted =
      proforma.status === "converted" ||
      proforma.status === "fully_invoiced" ||
      linkedTaxInvoices.length > 0;
    const items = proforma.items || [];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Visual Stepper */}
        <DocumentPipelineStepper
          currentStep="proforma"
          estimateNumber={proforma.estimate?.estimate_number}
          estimateId={proforma.estimate?.id}
          proformaNumber={proforma.proforma_number}
          proformaId={proforma.id}
          invoiceNumber={latestTaxInv?.invoice_number}
          invoiceId={latestTaxInv?.id}
          invoiceStatus={latestTaxInv?.status}
          onNavigate={(navType, id) => {
            if (navType === "estimate") {
              navigation.navigate("EstimateDetail", { estimateId: id });
            } else if (navType === "invoice") {
              navigation.navigate("InvoiceDetail", { invoiceId: id, type: "tax" });
            }
          }}
        />

        {/* Converted to Official Tax Invoice Banner */}
        {isConverted && latestTaxInv && (
          <Card style={styles.taxInvCard}>
            <View style={styles.taxInvCardHeader}>
              <View style={styles.taxInvIconBg}>
                <Ionicons name="receipt" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.taxInvCardTitle}>Tax Invoice Generated</Text>
                <Text style={styles.taxInvCardSub}>
                  Invoice #{latestTaxInv.invoice_number} • {formatDate(latestTaxInv.invoice_date)}
                </Text>
              </View>
              <Badge
                label={latestTaxInv.status === "paid" ? "PAID" : "UNPAID"}
                variant={latestTaxInv.status === "paid" ? "success" : "warning"}
              />
            </View>
            <Button
              title={`View Tax Invoice (${latestTaxInv.invoice_number}) →`}
              variant="primary"
              onPress={() =>
                navigation.navigate("InvoiceDetail", {
                  invoiceId: latestTaxInv.id,
                  type: "tax",
                })
              }
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* Status Card */}
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
                  : (proforma.status || "pending").replace("_", " ")
              }
              variant={isConverted ? "purple" : "info"}
            />
          </View>

          <View style={styles.advanceRow}>
            <View>
              <Text style={styles.dueLabel}>Total Amount</Text>
              <Text style={styles.dueAmount}>{formatCurrency(proforma.total_amount || 0)}</Text>
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
        </View>

        {items.length === 0 ? (
          <Card>
            <Text style={styles.noItemsText}>Standard milestone deliverables schedule</Text>
          </Card>
        ) : (
          items.map((item, idx) => {
            const hasDistinctTitle = Boolean(item.item_name && item.description && item.description !== item.item_name);
            const lineTitle = item.item_name || item.description || `Item #${idx + 1}`;
            const taxableAmount = item.amount ?? item.taxable_amount ?? (item.quantity * item.unit_price);
            const lineTotal = item.total_amount ?? (Number(taxableAmount) + Number(item.tax_amount || 0));

            return (
              <Card key={item.id || idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{lineTitle}</Text>
                {hasDistinctTitle && (
                  <Text style={styles.itemSubDesc}>{item.description}</Text>
                )}
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemQty}>
                    Qty: {item.quantity} {item.unit || "units"} @ {formatCurrency(item.unit_price)}
                  </Text>
                  <View style={styles.gstBadge}>
                    <Text style={styles.gstBadgeText}>+{item.tax_rate ?? item.gst_rate ?? 18}% GST</Text>
                  </View>
                </View>
                <View style={styles.itemDivider} />
                <View style={styles.itemFooterRow}>
                  <Text style={styles.itemTaxable}>
                    Taxable: {formatCurrency(taxableAmount)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    Gross: {formatCurrency(lineTotal)}
                  </Text>
                </View>
              </Card>
            );
          })
        )}

        {/* Accounting Summary */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Advance Billing Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal (Taxable)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(proforma.subtotal || 0)}</Text>
          </View>
          {Number(proforma.discount_amount || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                -{formatCurrency(proforma.discount_amount || 0)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST Component</Text>
            <Text style={styles.summaryValue}>+{formatCurrency(proforma.tax_amount || 0)}</Text>
          </View>
          {Number(proforma.round_off || 0) !== 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Round Off</Text>
              <Text style={styles.summaryValue}>
                {Number(proforma.round_off) > 0 ? "+" : ""}{formatCurrency(proforma.round_off || 0)}
              </Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.grossLabel}>Total Proforma Value</Text>
            <Text style={styles.grossValue}>{formatCurrency(proforma.total_amount || 0)}</Text>
          </View>
        </Card>
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
  const invoiceTotal = invoice.total_amount ?? invoice.total ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Visual Stepper */}
      <DocumentPipelineStepper
        currentStep="invoice"
        estimateNumber={invoice.estimate?.estimate_number}
        estimateId={invoice.estimate?.id}
        proformaNumber={invoice.proforma_invoice?.proforma_number}
        proformaId={invoice.proforma_invoice?.id}
        invoiceNumber={invoice.invoice_number}
        invoiceId={invoice.id}
        invoiceStatus={invoice.status}
        onNavigate={(navType, id) => {
          if (navType === "estimate") {
            navigation.navigate("EstimateDetail", { estimateId: id });
          } else if (navType === "proforma") {
            navigation.navigate("InvoiceDetail", { proformaId: id, type: "proforma" });
          }
        }}
      />

      {/* Commercial Origin Card */}
      {invoice.proforma_invoice && (
        <Card style={styles.originCard}>
          <View style={styles.originRow}>
            <Ionicons name="link-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.originTitle}>From Proforma #{invoice.proforma_invoice.proforma_number}</Text>
            </View>
            <Button
              title="View PI"
              variant="outline"
              onPress={() =>
                navigation.navigate("InvoiceDetail", {
                  proformaId: invoice.proforma_invoice!.id,
                  type: "proforma",
                })
              }
              style={styles.originBtn}
            />
          </View>
        </Card>
      )}

      {/* Top Status Card */}
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
              <Text style={styles.dueAmount}>{formatCurrency(invoiceTotal)}</Text>
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
      </View>

      {items.length === 0 ? (
        <Card>
          <Text style={styles.noItemsText}>Standard milestone deliverables schedule</Text>
        </Card>
      ) : (
        items.map((item, idx) => {
          const hasDistinctTitle = Boolean(item.item_name && item.description && item.description !== item.item_name);
          const lineTitle = item.item_name || item.description || `Item #${idx + 1}`;
          const taxableAmount = item.amount ?? item.taxable_amount ?? (item.quantity * item.unit_price);
          const lineTotal = item.total_amount ?? (Number(taxableAmount) + Number(item.tax_amount || 0));

          return (
            <Card key={item.id || idx} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{lineTitle}</Text>
              {hasDistinctTitle && (
                <Text style={styles.itemSubDesc}>{item.description}</Text>
              )}
              
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemQty}>
                  Qty: {item.quantity} {item.unit || "units"} @ {formatCurrency(item.unit_price)}
                </Text>
                <View style={styles.gstBadge}>
                  <Text style={styles.gstBadgeText}>+{item.tax_rate ?? item.gst_rate ?? 18}% GST</Text>
                </View>
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.itemFooterRow}>
                <Text style={styles.itemTaxable}>
                  Taxable: {formatCurrency(taxableAmount)}
                </Text>
                <Text style={styles.itemTotal}>
                  Gross: {formatCurrency(lineTotal)}
                </Text>
              </View>
            </Card>
          );
        })
      )}

      {/* Financial Breakdown Card */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Accounting Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal (Taxable)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal || 0)}</Text>
        </View>

        {Number(invoice.discount_amount || 0) > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              -{formatCurrency(invoice.discount_amount || 0)}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST Component</Text>
          <Text style={styles.summaryValue}>+{formatCurrency(invoice.tax_amount || 0)}</Text>
        </View>

        {Number(invoice.round_off || 0) !== 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Round Off</Text>
            <Text style={styles.summaryValue}>
              {Number(invoice.round_off) > 0 ? "+" : ""}{formatCurrency(invoice.round_off || 0)}
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.grossLabel}>Total Payable (INR)</Text>
          <Text style={styles.grossValue}>{formatCurrency(invoiceTotal)}</Text>
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
});
