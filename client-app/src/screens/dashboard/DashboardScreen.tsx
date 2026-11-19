import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { shadows } from "../../theme/shadows";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import {
  portalApi,
  DashboardResponse,
  Invoice,
  Project,
  Estimate,
  ProformaInvoice,
} from "../../api/portal";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDate } from "../../utils/date";

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await portalApi.getDashboard();
      setData(res);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      setPayingInvoiceId(invoiceId);
      const res = await portalApi.getPaymentLink(invoiceId);
      if (res.success && res.payment_link?.link_url) {
        await WebBrowser.openBrowserAsync(res.payment_link.link_url);
        fetchDashboard();
      } else {
        Alert.alert("Notice", "Payment gateway is being prepared. Please contact support.");
      }
    } catch (err: any) {
      Alert.alert("Payment Error", err.message || "Failed to generate payment gateway link.");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading client workspace...</Text>
      </View>
    );
  }

  const client = data?.client;
  const stats = data?.stats;

  // Safe defensive filtering (defense-in-depth against drafts)
  const recentInvoices: Invoice[] = (
    Array.isArray(data?.recent_invoices)
      ? data.recent_invoices
      : (data?.recent_invoices as any)?.data || []
  ).filter((inv: Invoice) => inv.status !== "draft");

  const projects: Project[] = Array.isArray(data?.projects)
    ? data.projects
    : (data?.projects as any)?.data || [];

  const activeEstimates: Estimate[] = (
    Array.isArray(data?.active_estimates) ? data.active_estimates : []
  ).filter((est: Estimate) => est.status !== "draft");

  const activeProformas: ProformaInvoice[] = (
    Array.isArray(data?.active_proformas) ? data.active_proformas : []
  ).filter((pi: ProformaInvoice) => pi.status !== "draft");

  // Outstanding balance & Settled figures with full zero/NaN defense
  const outstandingBalance = stats?.total_due ?? stats?.unpaid_amount ?? 0;
  const paidTotal =
    stats?.paid_amount ?? Math.max(0, (stats?.total_invoiced ?? 0) - outstandingBalance);
  const activeProjectsCount =
    stats?.active_projects ??
    projects.filter((p) => p.status === "in_progress" || p.status === "planning").length;
  const openTicketsCount = stats?.open_tickets ?? 0;
  const unpaidCount =
    stats?.unpaid_invoices_count ??
    recentInvoices.filter(
      (i) => i.status === "unpaid" || i.status === "partially_paid" || i.status === "overdue"
    ).length;

  // Active milestone action (if any)
  const pendingEst = activeEstimates.find((e) => e.status === "sent");
  const pendingProforma = activeProformas.find(
    (p) => p.status === "unpaid" || p.status === "partially_paid"
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* 1. Clean Header Greeting */}
      <View style={styles.headerArea}>
        <View style={styles.greetingCol}>
          <Text style={styles.welcomeSub}>Welcome back,</Text>
          <Text style={styles.clientTitle} numberOfLines={1}>
            {client?.company_name || client?.name || user?.name || "Client Partner"}
          </Text>
        </View>
        {client?.gstin ? (
          <View style={styles.gstinChip}>
            <Text style={styles.gstinText}>{client.gstin}</Text>
          </View>
        ) : null}
      </View>

      {/* 2. Hero Account Health Card */}
      <View style={styles.heroBalanceCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>Outstanding Balance</Text>
          {outstandingBalance > 0 && unpaidCount > 0 ? (
            <View style={styles.dueBadge}>
              <Ionicons name="alert-circle" size={13} color={colors.warning} />
              <Text style={styles.dueBadgeText}>{unpaidCount} due</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.heroAmount}>{formatCurrency(outstandingBalance)}</Text>

        <View style={styles.heroDivider} />

        <View style={styles.heroFooter}>
          <Text style={styles.heroFooterText}>
            {outstandingBalance > 0
              ? `${unpaidCount} invoice(s) awaiting payment`
              : "No balance due"}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("BillingTab")}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.heroActionBtnText}>
              {outstandingBalance > 0 ? "Pay Invoices →" : "Billing History →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Crisp Dual Metrics Row */}
      <View style={styles.statsStrip}>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Total Paid</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatCurrency(paidTotal)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <TouchableOpacity
          style={styles.statChip}
          onPress={() => navigation.navigate("ProjectsTab")}
          activeOpacity={0.7}
        >
          <Text style={styles.statLabel}>Active Projects</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {activeProjectsCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Action Required Milestone Banner (Conditional) */}
      {pendingEst ? (
        <TouchableOpacity
          style={styles.actionBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("EstimateDetail", { estimateId: pendingEst.id })}
        >
          <View style={[styles.actionBannerIconBg, { backgroundColor: colors.warningBg }]}>
            <Ionicons name="document-text-outline" size={18} color={colors.warning} />
          </View>
          <View style={styles.actionBannerContent}>
            <View style={styles.actionBannerHeadingRow}>
              <Text style={styles.actionBannerTitle}>Proposal Awaiting Review</Text>
              <Badge label="REVIEW" variant="warning" size="sm" />
            </View>
            <Text style={styles.actionBannerSub}>
              {pendingEst.estimate_number} • {formatCurrency(pendingEst.total_amount ?? pendingEst.total ?? 0)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : pendingProforma ? (
        <TouchableOpacity
          style={styles.actionBanner}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("InvoiceDetail", {
              proformaId: pendingProforma.id,
              type: "proforma",
            })
          }
        >
          <View style={[styles.actionBannerIconBg, { backgroundColor: colors.purpleBg }]}>
            <Ionicons name="flash-outline" size={18} color={colors.purple} />
          </View>
          <View style={styles.actionBannerContent}>
            <View style={styles.actionBannerHeadingRow}>
              <Text style={styles.actionBannerTitle}>Proforma Invoice</Text>
              <Badge
                label={
                  pendingProforma.status === "paid"
                    ? "PAID"
                    : pendingProforma.paid_amount && pendingProforma.paid_amount > 0
                    ? "PARTIALLY PAID"
                    : "IN PROGRESS"
                }
                variant={
                  pendingProforma.status === "paid"
                    ? "success"
                    : pendingProforma.paid_amount && pendingProforma.paid_amount > 0
                    ? "warning"
                    : "purple"
                }
                size="sm"
              />
            </View>
            <Text style={styles.actionBannerSub}>
              {pendingProforma.proforma_number} •{" "}
              {pendingProforma.paid_amount && pendingProforma.paid_amount > 0
                ? `${formatCurrency(
                    Math.max(0, (pendingProforma.total_amount ?? 0) - pendingProforma.paid_amount)
                  )} Due (${formatCurrency(pendingProforma.paid_amount)} Paid)`
                : formatCurrency(pendingProforma.total_amount ?? 0)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      {/* 5. Recent Invoices Section (Only if data exists) */}
      {recentInvoices.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate("BillingTab")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentInvoices.slice(0, 3).map((inv: Invoice) => {
            const isPaid = inv.status === "paid";
            const isPaying = payingInvoiceId === inv.id;

            return (
              <TouchableOpacity
                key={inv.id}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("InvoiceDetail", { invoiceId: inv.id, type: "tax" })
                }
              >
                <Card style={styles.invoiceCard}>
                  <View style={styles.invoiceTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.invoiceNumber}>{inv.invoice_number}</Text>
                      <Text style={styles.invoiceDate}>
                        {inv.due_date
                          ? `Due: ${formatDate(inv.due_date)}`
                          : `Date: ${formatDate(inv.invoice_date)}`}
                      </Text>
                    </View>
                    <Badge
                      label={(inv.status || "pending").replace("_", " ").toUpperCase()}
                      variant={isPaid ? "success" : inv.status === "overdue" ? "danger" : "warning"}
                      size="sm"
                    />
                  </View>

                  <View style={styles.invoiceDivider} />

                  <View style={styles.invoiceBottomRow}>
                    <View>
                      <Text style={styles.invoiceAmountLabel}>Amount</Text>
                      <Text style={styles.invoiceAmount}>
                        {formatCurrency(inv.total_amount ?? inv.total ?? 0)}
                      </Text>
                    </View>

                    {!isPaid ? (
                      <Button
                        title="Pay Now"
                        onPress={() => handlePayInvoice(inv.id)}
                        loading={isPaying}
                        variant="primary"
                        icon={<Ionicons name="card-outline" size={14} color={colors.textLight} />}
                        style={styles.payButton}
                      />
                    ) : (
                      <View style={styles.paidIndicator}>
                        <Ionicons name="checkmark-done" size={14} color={colors.success} />
                        <Text style={styles.paidIndicatorText}>Paid</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* 6. Active Projects Section (Only if data exists) */}
      {projects.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Projects</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ProjectsTab")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {projects.slice(0, 2).map((proj: Project) => {
            const pendingDocs = (proj.file_requests || []).filter(
              (r) => r.status === "pending" || r.status === "rejected"
            );

            return (
              <TouchableOpacity
                key={proj.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("ProjectDetail", { projectId: proj.id })}
              >
                <Card style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {proj.name}
                    </Text>
                    <Badge
                      label={(proj.status || "active").replace("_", " ").toUpperCase()}
                      variant="info"
                      size="sm"
                    />
                  </View>
                  {proj.description ? (
                    <Text style={styles.projectDesc} numberOfLines={2}>
                      {proj.description}
                    </Text>
                  ) : null}

                  {pendingDocs.length > 0 && (
                    <View style={styles.projectNoticeRow}>
                      <Ionicons name="alert-circle" size={12} color={colors.warning} />
                      <Text style={styles.projectNoticeText}>
                        Action Required: Document requested — Upload files
                      </Text>
                    </View>
                  )}

                  <View style={styles.projectFooter}>
                    <View style={styles.projectMeta}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.projectMetaText}>
                        {proj.deadline ? `Target: ${formatDate(proj.deadline)}` : "Ongoing"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* 7. Reassuring Status Indicator when no action or records are pending */}
      {recentInvoices.length === 0 && projects.length === 0 && !pendingEst && !pendingProforma && (
        <Card style={styles.allClearCard}>
          <Ionicons name="checkmark-done-circle-outline" size={26} color={colors.success} />
          <Text style={styles.allClearTitle}>Workspace All Clear</Text>
          <Text style={styles.allClearSub}>
            Active projects, deliverables, and invoices will appear here as work progresses.
          </Text>
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // 1. Clean Header Area
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  greetingCol: {
    flex: 1,
    marginRight: 10,
  },
  welcomeSub: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 14,
    includeFontPadding: false,
    marginBottom: 0,
  },
  clientTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
    marginTop: 0,
  },
  gstinChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gstinText: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // 2. Hero Account Health Card (Slim & Compact Height)
  heroBalanceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  heroLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 4,
  },
  dueBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.warning,
  },
  heroAmount: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.4,
    marginVertical: 1,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 5,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroFooterText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  heroActionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },

  // 3. Crisp Secondary Metrics Row
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.card,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.borderLight,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
  },

  // 4. Action Required Banner
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.card,
  },
  actionBannerIconBg: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  actionBannerContent: {
    flex: 1,
  },
  actionBannerHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  actionBannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.text,
  },
  actionBannerSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  viewAllText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.primary,
  },

  // Empty State / All Clear Card
  allClearCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  allClearTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    marginTop: 6,
  },
  allClearSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
    maxWidth: 260,
    lineHeight: 15,
  },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
  },
  emptyCardSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 3,
    maxWidth: 240,
  },

  // Invoices List
  invoiceCard: {
    marginBottom: 8,
    padding: 12,
  },
  invoiceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceNumber: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  invoiceDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  invoiceBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceAmountLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  invoiceAmount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    marginTop: 1,
  },
  payButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  paidIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  paidIndicatorText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.success,
  },

  // Projects List
  projectCard: {
    marginBottom: 8,
    padding: 12,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  projectName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  projectDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  projectNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 6,
    gap: 5,
  },
  projectNoticeText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.warning,
    flex: 1,
  },
  projectFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  projectMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  projectMetaText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
