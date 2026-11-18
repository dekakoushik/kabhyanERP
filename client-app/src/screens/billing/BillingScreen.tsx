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
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { portalApi, CommercialThread, DocumentHistoryItem } from "../../api/portal";
import { formatDate, formatCurrency } from "../../utils/date";

export const BillingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [threads, setThreads] = useState<CommercialThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "action_required" | "unpaid" | "settled">("all");
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await portalApi.getCommercialDocuments(
        searchQuery.trim() || undefined,
        statusFilter !== "all" ? statusFilter : undefined
      );
      setThreads(res.threads || []);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load commercial documents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchThreads();
  }, [fetchThreads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads();
  };

  const handlePayTaxInvoice = async (invoiceId: number) => {
    try {
      setPayingId(invoiceId);
      const res = await portalApi.getPaymentLink(invoiceId);
      if (res.success && res.payment_link?.link_url) {
        await WebBrowser.openBrowserAsync(res.payment_link.link_url);
        fetchThreads();
      } else {
        Alert.alert("Notice", "Payment gateway is not configured for this invoice yet.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate payment gateway link.");
    } finally {
      setPayingId(null);
    }
  };

  const navigateToDocument = (thread: CommercialThread) => {
    if (thread.stage === "tax_invoice") {
      navigation.navigate("InvoiceDetail", { invoiceId: thread.headline_id, type: "tax" });
    } else if (thread.stage === "proforma") {
      navigation.navigate("InvoiceDetail", { proformaId: thread.headline_id, type: "proforma" });
    } else {
      navigation.navigate("EstimateDetail", { estimateId: thread.headline_id });
    }
  };

  const renderStageBadge = (stage: string) => {
    switch (stage) {
      case "tax_invoice":
        return <Badge label="TAX INVOICE" variant="success" size="sm" />;
      case "proforma":
        return <Badge label="PROFORMA" variant="purple" size="sm" />;
      case "estimate":
        return <Badge label="QUOTATION" variant="warning" size="sm" />;
      default:
        return <Badge label={stage.toUpperCase()} variant="neutral" size="sm" />;
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    // Do not show internal "sent" or "draft" statuses in client-facing cards
    if (s === "sent" || s === "draft") {
      return null;
    }

    let variant: "success" | "warning" | "danger" | "purple" | "neutral" = "neutral";
    if (s === "paid" || s === "accepted") variant = "success";
    else if (s === "unpaid" || s === "partially_paid") variant = "warning";
    else if (s === "overdue" || s === "declined" || s === "cancelled") variant = "danger";
    else if (s === "invoiced" || s === "converted") variant = "purple";

    return (
      <Badge
        label={status.replace("_", " ").toUpperCase()}
        variant={variant}
        size="sm"
      />
    );
  };

  const renderThreadCard = ({ item }: { item: CommercialThread }) => {
    const isTax = item.stage === "tax_invoice";
    const isPaid = item.headline_status === "paid";
    const isPaying = payingId === item.headline_id;
    const dateFormatted = formatDate(item.due_date || item.headline_date);

    // Lineage subtitle text if converted from earlier document
    const lineageText =
      item.history && item.history.length > 0
        ? ` • via ${item.history
            .map((h: DocumentHistoryItem) =>
              h.stage === "proforma" ? `PI #${h.number}` : `Quote #${h.number}`
            )
            .join(", ")}`
        : "";

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigateToDocument(item)}
      >
        <Card style={styles.threadCard}>
          {/* Row 1: Document # + Stage Badge (Left) | Amount (Right) */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.documentNumber}>{item.headline_number}</Text>
              {renderStageBadge(item.stage)}
            </View>
            <Text style={styles.amountValue}>
              {formatCurrency(item.total_amount)}
            </Text>
          </View>

          {/* Row 2: Context / Date / Lineage (Left) | Status / Action (Right) */}
          <View style={styles.bottomRow}>
            <Text style={styles.contextText} numberOfLines={1}>
              {item.project_name
                ? `${item.project_name} • ${item.due_date ? `Due ${dateFormatted}` : dateFormatted}`
                : item.due_date
                ? `Due: ${dateFormatted}`
                : dateFormatted}
              {lineageText}
            </Text>

            <View style={styles.actionGroup}>
              {isTax && !isPaid ? (
                <TouchableOpacity
                  style={styles.compactPayBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePayTaxInvoice(item.headline_id);
                  }}
                  disabled={isPaying}
                  activeOpacity={0.8}
                >
                  {isPaying ? (
                    <ActivityIndicator size="small" color={colors.textLight} />
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={11} color={colors.textLight} />
                      <Text style={styles.compactPayBtnText}>Pay</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                renderStatusBadge(item.headline_status)
              )}
              <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by doc # or project name..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={fetchThreads}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Bar (Zero Tabs: Quick filter chips only) */}
      <View style={styles.filterBar}>
        {[
          { key: "all", label: "All" },
          { key: "action_required", label: "Action Required" },
          { key: "unpaid", label: "Unpaid" },
          { key: "settled", label: "Paid" },
        ].map((chip) => {
          const isSelected = statusFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setStatusFilter(chip.key as any)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading billing records...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.thread_id}
          renderItem={renderThreadCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No Documents Yet"
              description={
                searchQuery
                  ? "No documents match your search criteria."
                  : "Your quotes and invoices will appear here."
              }
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    height: "100%",
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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

  // Compact 2-Tier High-Density Thread Card
  threadCard: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginBottom: 7,
    borderRadius: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  documentNumber: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    letterSpacing: -0.2,
  },
  amountValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  contextText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  compactPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  compactPayBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textLight,
  },
});
