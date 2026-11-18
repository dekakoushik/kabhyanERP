import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { portalApi, Invoice, ProformaInvoice } from "../../api/portal";

export const InvoicesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Document Type Tab: "tax" or "proforma"
  const [docType, setDocType] = useState<"tax" | "proforma">("tax");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proformas, setProformas] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [taxFilter, setTaxFilter] = useState<string>("all");
  const [proformaFilter, setProformaFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (docType === "tax") {
        const statusParam = taxFilter !== "all" ? taxFilter : undefined;
        const res = await portalApi.getInvoices(statusParam);
        const data = Array.isArray(res.invoices)
          ? res.invoices
          : (res.invoices as any)?.data || [];
        setInvoices(data);
      } else {
        const statusParam = proformaFilter !== "all" ? proformaFilter : undefined;
        const res = await portalApi.getProformaInvoices(statusParam);
        const data = Array.isArray(res.proforma_invoices)
          ? res.proforma_invoices
          : (res.proforma_invoices as any)?.data || [];
        setProformas(data);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [docType, taxFilter, proformaFilter]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePayTaxInvoice = async (invoiceId: number) => {
    try {
      setPayingId(invoiceId);
      const res = await portalApi.getPaymentLink(invoiceId);
      if (res.success && res.payment_link?.link_url) {
        await WebBrowser.openBrowserAsync(res.payment_link.link_url);
        fetchData();
      } else {
        Alert.alert("Notice", "Payment gateway is not configured for this invoice yet.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate payment gateway link.");
    } finally {
      setPayingId(null);
    }
  };

  // Tax Invoices Filtering
  const invoiceList = Array.isArray(invoices) ? invoices : [];
  const filteredTaxInvoices = invoiceList.filter((inv) => {
    if (!searchQuery.trim()) return true;
    return (inv.invoice_number || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Proforma Invoices Filtering
  const proformaList = Array.isArray(proformas) ? proformas : [];
  const filteredProformas = proformaList.filter((pi) => {
    if (!searchQuery.trim()) return true;
    return (pi.proforma_number || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderTaxInvoiceCard = ({ item }: { item: Invoice }) => {
    const isPaid = item.status === "paid";
    const isPaying = payingId === item.id;

    return (
      <Card style={styles.invoiceCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id, type: "tax" })}
        >
          <View style={styles.cardHeader}>
            <View>
              <View style={styles.typeTagRow}>
                <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
                <View style={styles.taxTag}>
                  <Text style={styles.taxTagText}>TAX INVOICE</Text>
                </View>
              </View>
              <Text style={styles.invoiceDate}>Issued on: {item.invoice_date}</Text>
            </View>
            <Badge
              label={(item.status || "pending").replace("_", " ")}
              variant={isPaid ? "success" : item.status === "overdue" ? "danger" : "warning"}
            />
          </View>

          {item.proforma_invoice && (
            <View style={styles.originBanner}>
              <Ionicons name="link-outline" size={13} color={colors.primary} />
              <Text style={styles.originBannerText}>
                Converted from Proforma #{item.proforma_invoice.proforma_number}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.metaLabel}>Subtotal</Text>
              <Text style={styles.metaValue}>₹{Number(item.subtotal || 0).toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>GST (18%)</Text>
              <Text style={styles.metaValue}>+₹{Number(item.tax_amount || 0).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.metaLabel}>Total Due</Text>
              <Text style={styles.grossTotal}>₹{Number(item.total).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.viewDetailBtn}
              onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id, type: "tax" })}
            >
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
              <Text style={styles.viewDetailText}>View Details</Text>
            </TouchableOpacity>

            {!isPaid && (
              <Button
                title="Pay Now"
                onPress={() => handlePayTaxInvoice(item.id)}
                loading={isPaying}
                icon={<Ionicons name="card-outline" size={14} color={colors.textLight} />}
                style={styles.payBtn}
              />
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderProformaInvoiceCard = ({ item }: { item: ProformaInvoice }) => {
    const linkedTaxInv = item.tax_invoices && item.tax_invoices[0];
    const isConverted =
      item.status === "converted" ||
      item.status === "fully_invoiced" ||
      Boolean(linkedTaxInv);
    const isPaid = item.status === "paid" || (linkedTaxInv && linkedTaxInv.status === "paid");

    return (
      <Card style={styles.invoiceCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("InvoiceDetail", { proformaId: item.id, type: "proforma" })}
        >
          <View style={styles.cardHeader}>
            <View>
              <View style={styles.typeTagRow}>
                <Text style={styles.invoiceNumber}>{item.proforma_number}</Text>
                <View style={styles.proformaTag}>
                  <Text style={styles.proformaTagText}>PROFORMA</Text>
                </View>
              </View>
              <Text style={styles.invoiceDate}>Issued on: {item.invoice_date}</Text>
            </View>
            <Badge
              label={
                isConverted
                  ? "CONVERTED TO TAX INV"
                  : (item.status || "pending").replace("_", " ")
              }
              variant={isConverted ? "purple" : isPaid ? "success" : "info"}
            />
          </View>

          {/* Linked Tax Invoice Banner with Live Paid / Unpaid Status */}
          {linkedTaxInv && (
            <View style={styles.taxInvBanner}>
              <Ionicons
                name="receipt-outline"
                size={13}
                color={linkedTaxInv.status === "paid" ? colors.success : colors.warning}
              />
              <Text style={styles.taxInvBannerText}>
                Official Tax Inv: {linkedTaxInv.invoice_number}
              </Text>
              <View
                style={[
                  styles.taxInvMiniBadge,
                  linkedTaxInv.status === "paid" ? styles.bgPaid : styles.bgUnpaid,
                ]}
              >
                <Text
                  style={[
                    styles.taxInvMiniBadgeText,
                    linkedTaxInv.status === "paid" ? styles.textPaid : styles.textUnpaid,
                  ]}
                >
                  {linkedTaxInv.status === "paid" ? "PAID" : "UNPAID"}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.metaLabel}>Scope Amount</Text>
              <Text style={styles.metaValue}>₹{Number(item.subtotal || 0).toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>GST</Text>
              <Text style={styles.metaValue}>+₹{Number(item.tax_amount || 0).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.metaLabel}>Advance Total</Text>
              <Text style={styles.grossTotal}>₹{Number(item.total_amount || 0).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.viewDetailBtn}
              onPress={() => navigation.navigate("InvoiceDetail", { proformaId: item.id, type: "proforma" })}
            >
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
              <Text style={styles.viewDetailText}>View Advance Scope</Text>
            </TouchableOpacity>

            <View style={styles.proformaHint}>
              <Text style={styles.proformaHintText}>Preliminary Advance Bill</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Document Type Segmented Control */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, docType === "tax" && styles.segmentBtnActive]}
            onPress={() => {
              setDocType("tax");
              setSearchQuery("");
            }}
          >
            <Ionicons
              name="file-tray-full-outline"
              size={15}
              color={docType === "tax" ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.segmentText, docType === "tax" && styles.segmentTextActive]}>
              Tax Invoices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, docType === "proforma" && styles.segmentBtnActive]}
            onPress={() => {
              setDocType("proforma");
              setSearchQuery("");
            }}
          >
            <Ionicons
              name="receipt-outline"
              size={15}
              color={docType === "proforma" ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.segmentText, docType === "proforma" && styles.segmentTextActive]}>
              Proforma Invoices
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              docType === "tax"
                ? "Search by Tax Invoice (e.g. INV-2026-001)..."
                : "Search by Proforma (e.g. PI-2026-001)..."
            }
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(docType === "tax"
          ? [
              { key: "all", label: "All Invoices" },
              { key: "unpaid", label: "Pending" },
              { key: "paid", label: "Paid" },
              { key: "overdue", label: "Overdue" },
            ]
          : [
              { key: "all", label: "All Proformas" },
              { key: "sent", label: "Pending Advance" },
              { key: "paid", label: "Settled" },
              { key: "converted", label: "Converted" },
            ]
        ).map((tab) => {
          const isActive = docType === "tax" ? taxFilter === tab.key : proformaFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => {
                if (docType === "tax") {
                  setTaxFilter(tab.key);
                } else {
                  setProformaFilter(tab.key);
                }
              }}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {docType === "tax" ? "Fetching tax invoices..." : "Fetching proforma invoices..."}
          </Text>
        </View>
      ) : docType === "tax" ? (
        <FlatList
          data={filteredTaxInvoices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTaxInvoiceCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No Tax Invoices Found"
              description="There are no formal GST tax invoices matching the selected filter."
            />
          }
        />
      ) : (
        <FlatList
          data={filteredProformas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProformaInvoiceCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No Proforma Invoices"
              description="There are no preliminary proforma invoices issued for this account."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentedContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.card,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  invoiceCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  typeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  taxTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taxTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
  },
  proformaTag: {
    backgroundColor: colors.purpleBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proformaTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.purple,
  },
  originBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  originBannerText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  taxInvBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  taxInvBannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.purple,
    flex: 1,
  },
  taxInvMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taxInvMiniBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  bgPaid: {
    backgroundColor: "#DCFCE7",
  },
  bgUnpaid: {
    backgroundColor: "#FEF3C7",
  },
  textPaid: {
    color: "#166534",
  },
  textUnpaid: {
    color: "#92400E",
  },
  invoiceDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  grossTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  viewDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  payBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  proformaHint: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proformaHintText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
