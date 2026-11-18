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
import { portalApi, Invoice, InvoiceItem } from "../../api/portal";

export const InvoiceDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await portalApi.getInvoice(invoiceId);
      setInvoice(res.invoice);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [invoiceId]);

  const handlePay = async () => {
    try {
      setPaying(true);
      const res = await portalApi.getPaymentLink(invoiceId);
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

  if (loading || !invoice) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
      </View>
    );
  }

  const isPaid = invoice.status === "paid";
  const items = invoice.items || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Status Card */}
      <Card style={styles.statusCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.dateText}>Issued on: {invoice.invoice_date}</Text>
            <Text style={styles.dateText}>Payment Due: {invoice.due_date || "Upon receipt"}</Text>
          </View>
          <Badge
            label={invoice.status.replace("_", " ")}
            variant={isPaid ? "success" : invoice.status === "overdue" ? "danger" : "warning"}
          />
        </View>

        {!isPaid && (
          <View style={styles.payBox}>
            <View>
              <Text style={styles.dueLabel}>Amount Payable</Text>
              <Text style={styles.dueAmount}>₹{Number(invoice.total).toLocaleString()}</Text>
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
        items.map((item, idx) => (
          <Card key={item.id || idx} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.description}</Text>
            
            <View style={styles.itemMetaRow}>
              <Text style={styles.itemQty}>
                Qty: {item.quantity} {item.unit || "units"} @ ₹{Number(item.unit_price).toLocaleString()}
              </Text>
              <View style={styles.gstBadge}>
                <Text style={styles.gstBadgeText}>+{item.gst_rate || 18}% GST</Text>
              </View>
            </View>

            <View style={styles.itemDivider} />

            <View style={styles.itemFooterRow}>
              <Text style={styles.itemTaxable}>
                Taxable: ₹{Number(item.taxable_amount || (item.quantity * item.unit_price)).toLocaleString()}
              </Text>
              <Text style={styles.itemTotal}>
                Gross: ₹{Number(item.total_amount || 0).toLocaleString()}
              </Text>
            </View>
          </Card>
        ))
      )}

      {/* Financial Breakdown Card */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Accounting Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taxable Turnover (Subtotal)</Text>
          <Text style={styles.summaryValue}>₹{Number(invoice.subtotal).toLocaleString()}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Goods & Services Tax (GST)</Text>
          <Text style={styles.summaryValue}>+₹{Number(invoice.tax_amount).toLocaleString()}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.grossLabel}>Total Payable (INR)</Text>
          <Text style={styles.grossValue}>₹{Number(invoice.total).toLocaleString()}</Text>
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
  statusCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  dateText: {
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
  dueLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dueAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
  },
  payNowBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6,
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
    marginBottom: 6,
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
    backgroundColor: colors.card,
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
