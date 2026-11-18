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
        return <Badge label="TAX INVOICE" variant="success" />;
      case "proforma":
        return <Badge label="PROFORMA" variant="purple" />;
      case "estimate":
        return <Badge label="QUOTATION" variant="warning" />;
      default:
        return <Badge label={stage.toUpperCase()} variant="neutral" />;
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let variant: "success" | "warning" | "danger" | "purple" | "neutral" = "neutral";
    if (s === "paid" || s === "accepted") variant = "success";
    else if (s === "unpaid" || s === "sent" || s === "partially_paid") variant = "warning";
    else if (s === "overdue" || s === "declined" || s === "cancelled") variant = "danger";
    else if (s === "invoiced" || s === "converted") variant = "purple";

    return <Badge label={status.replace("_", " ").toUpperCase()} variant={variant} />;
  };

  const renderThreadCard = ({ item }: { item: CommercialThread }) => {
    const isTax = item.stage === "tax_invoice";
    const isProforma = item.stage === "proforma";
    const isPaid = item.headline_status === "paid";
    const isPaying = payingId === item.headline_id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigateToDocument(item)}
      >
        <Card style={styles.threadCard}>
          {/* Top Row: Type Badge + Document Number + Status */}
          <View style={styles.topRow}>
            <View style={styles.stageNumberRow}>
              {renderStageBadge(item.stage)}
              <Text style={styles.documentNumber}>{item.headline_number}</Text>
            </View>
            {renderStatusBadge(item.headline_status)}
          </View>

          {/* Project & Scope Title */}
          {item.project_name ? (
            <View style={styles.projectRow}>
              <Ionicons name="briefcase-outline" size={13} color={colors.textMuted} />
              <Text style={styles.projectName} numberOfLines={1}>
                {item.project_name}
              </Text>
            </View>
          ) : null}

          {/* Date & Valuation Row */}
          <View style={styles.metaRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>
                {item.due_date ? "Payment Due" : "Document Date"}
              </Text>
              <Text style={styles.dateValue}>
                {formatDate(item.due_date || item.headline_date)}
              </Text>
            </View>

            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>Total Value</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(item.total_amount)}
              </Text>
            </View>
          </View>

          {/* History & Evolutionary Lineage Strip */}
          {item.history && item.history.length > 0 ? (
            <View style={styles.historyContainer}>
              <View style={styles.historyLine}>
                <Ionicons name="git-branch-outline" size={13} color={colors.primary} />
                <Text style={styles.historyText} numberOfLines={1}>
                  Lineage:{" "}
                  {item.history
                    .map((h: DocumentHistoryItem) =>
                      h.stage === "proforma" ? `PI #${h.number}` : `Quote #${h.number}`
                    )
                    .join(" • ")}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Card Footer with Direct Action */}
          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>
              {isTax && isPaid
                ? "Tax invoice paid & fully certified"
                : isTax && !isPaid
                ? "Tax invoice awaiting settlement"
                : isProforma
                ? "Preliminary milestone mobilization"
                : "Quotation scope awaiting review"}
            </Text>

            {isTax && !isPaid ? (
              <Button
                title="Pay Now"
                onPress={() => handlePayTaxInvoice(item.headline_id)}
                loading={isPaying}
                variant="primary"
                icon={<Ionicons name="card-outline" size={14} color={colors.textLight} />}
                style={styles.payBtn}
              />
            ) : (
              <TouchableOpacity
                onPress={() => navigateToDocument(item)}
                style={styles.detailsLink}
                activeOpacity={0.7}
              >
                <Text style={styles.detailsLinkText}>View Details →</Text>
              </TouchableOpacity>
            )}
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
          { key: "all", label: "All Documents" },
          { key: "action_required", label: "Action Needed" },
          { key: "unpaid", label: "Unpaid" },
          { key: "settled", label: "Settled" },
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
          <Text style={styles.loadingText}>Loading billing lifecycle records...</Text>
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
              title="No Billing Records Found"
              description={
                searchQuery
                  ? "No documents match your search criteria. Try a different term."
                  : "Commercial proposals, proforma invoices, and tax invoices will appear here."
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
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
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
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
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  threadCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stageNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  documentNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  projectName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: colors.borderLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  historyContainer: {
    backgroundColor: colors.primaryLight,
    borderColor: "#C7D2FE",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  historyLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  historyText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  payBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailsLink: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
});
