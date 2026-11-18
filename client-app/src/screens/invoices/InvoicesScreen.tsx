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
import { portalApi, Invoice } from "../../api/portal";

export const InvoicesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchInvoices = useCallback(async (filter?: string) => {
    try {
      const statusParam = filter && filter !== "all" ? filter : undefined;
      const res = await portalApi.getInvoices(statusParam);
      setInvoices(res.invoices || []);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices(activeFilter);
  }, [fetchInvoices, activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices(activeFilter);
  };

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      setPayingId(invoiceId);
      const res = await portalApi.getPaymentLink(invoiceId);
      if (res.success && res.payment_link?.link_url) {
        await WebBrowser.openBrowserAsync(res.payment_link.link_url);
        fetchInvoices(activeFilter);
      } else {
        Alert.alert("Notice", "Payment gateway is not configured for this invoice yet.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate payment gateway link.");
    } finally {
      setPayingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    return inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const isPaid = item.status === "paid";
    const isPaying = payingId === item.id;

    return (
      <Card style={styles.invoiceCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
              <Text style={styles.invoiceDate}>Issued: {item.invoice_date}</Text>
            </View>
            <Badge
              label={item.status.replace("_", " ")}
              variant={isPaid ? "success" : item.status === "overdue" ? "danger" : "warning"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.metaLabel}>Taxable Turnover</Text>
              <Text style={styles.metaValue}>₹{Number(item.subtotal || 0).toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>GST (18%)</Text>
              <Text style={styles.metaValue}>+₹{Number(item.tax_amount || 0).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.metaLabel}>Gross Total</Text>
              <Text style={styles.grossTotal}>₹{Number(item.total).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.viewDetailBtn}
              onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: item.id })}
            >
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
              <Text style={styles.viewDetailText}>View Scope & Items</Text>
            </TouchableOpacity>

            {!isPaid && (
              <Button
                title="Pay Online"
                onPress={() => handlePayInvoice(item.id)}
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

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by invoice number (e.g. INV-2026-001)..."
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
        {[
          { key: "all", label: "All Invoices" },
          { key: "unpaid", label: "Pending" },
          { key: "paid", label: "Paid" },
          { key: "overdue", label: "Overdue" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterChipText, activeFilter === tab.key && styles.filterChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching tax invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInvoiceCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No Invoices Found"
              description="There are no tax invoices matching the selected filter criteria."
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    height: 42,
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
    paddingVertical: 6,
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
  invoiceNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  invoiceDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
});
