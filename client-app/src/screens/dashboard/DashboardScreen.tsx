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
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { portalApi, DashboardResponse, Invoice, Project } from "../../api/portal";
import { useAuth } from "../../context/AuthContext";

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
        // Refresh dashboard on return to catch paid webhook status
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
  const recentInvoices = Array.isArray(data?.recent_invoices)
    ? data.recent_invoices
    : (data?.recent_invoices as any)?.data || [];
  const projects = Array.isArray(data?.projects)
    ? data.projects
    : (data?.projects as any)?.data || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Welcome Banner */}
      <Card style={styles.welcomeCard}>
        <View style={styles.welcomeTopRow}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.verifiedText}>Verified Corporate Account</Text>
          </View>
          {client?.gstin && (
            <Text style={styles.gstinText}>GSTIN: {client.gstin}</Text>
          )}
        </View>

        <Text style={styles.companyName}>
          {client?.company_name || client?.name || user?.name || "Client Partner"}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Track active milestones, review deliverables, manage proforma & tax invoices, and approve project scope.
        </Text>
      </Card>

      {/* KPI Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        {/* Outstanding Balance */}
        <View style={[styles.metricCard, { borderLeftColor: (stats?.unpaid_amount || 0) > 0 ? colors.warning : colors.success }]}>
          <Text style={styles.metricLabel}>Outstanding Balance</Text>
          <Text style={[styles.metricValue, { color: (stats?.unpaid_amount || 0) > 0 ? colors.warning : colors.success }]}>
            ₹{Number(stats?.unpaid_amount || 0).toLocaleString()}
          </Text>
          <Text style={styles.metricSub}>{stats?.unpaid_invoices_count || 0} invoice(s) due</Text>
        </View>

        {/* Paid Revenue */}
        <View style={[styles.metricCard, { borderLeftColor: colors.success }]}>
          <Text style={styles.metricLabel}>Total Settled</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            ₹{Number(stats?.paid_amount || 0).toLocaleString()}
          </Text>
          <Text style={styles.metricSub}>Lifetime payments</Text>
        </View>

        {/* Active Projects */}
        <View style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.metricLabel}>Active Projects</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            {stats?.active_projects || 0}
          </Text>
          <Text style={styles.metricSub}>Ongoing deliverables</Text>
        </View>

        {/* Open Tickets */}
        <View style={[styles.metricCard, { borderLeftColor: colors.purple }]}>
          <Text style={styles.metricLabel}>Support Tickets</Text>
          <Text style={[styles.metricValue, { color: colors.purple }]}>
            {stats?.open_tickets || 0}
          </Text>
          <Text style={styles.metricSub}>Active inquiries</Text>
        </View>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("InvoicesTab")}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.actionBtnLabel}>Invoices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("ProjectsTab")}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.infoBg }]}>
            <Ionicons name="briefcase-outline" size={20} color={colors.info} />
          </View>
          <Text style={styles.actionBtnLabel}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("EstimatesTab")}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.warningBg }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.warning} />
          </View>
          <Text style={styles.actionBtnLabel}>Quotes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("TicketsTab")}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.purpleBg }]}>
            <Ionicons name="help-buoy-outline" size={20} color={colors.purple} />
          </View>
          <Text style={styles.actionBtnLabel}>Support</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Invoices Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Invoices</Text>
        <TouchableOpacity onPress={() => navigation.navigate("InvoicesTab")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentInvoices.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyCardTitle}>No Invoices Issued Yet</Text>
          <Text style={styles.emptyCardSub}>When tax invoices are generated for milestones, they will appear here.</Text>
        </Card>
      ) : (
        recentInvoices.map((inv: Invoice) => {
          const isPaid = inv.status === "paid";
          const isPaying = payingInvoiceId === inv.id;

          return (
            <Card key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View>
                  <Text style={styles.invoiceNumber}>{inv.invoice_number}</Text>
                  <Text style={styles.invoiceDate}>Due: {inv.due_date || "Upon receipt"}</Text>
                </View>
                <Badge
                  label={(inv.status || "pending").replace("_", " ")}
                  variant={isPaid ? "success" : inv.status === "overdue" ? "danger" : "warning"}
                />
              </View>

              <View style={styles.invoiceDivider} />

              <View style={styles.invoiceBottomRow}>
                <View>
                  <Text style={styles.invoiceAmountLabel}>Total Gross</Text>
                  <Text style={styles.invoiceAmount}>₹{Number(inv.total).toLocaleString()}</Text>
                </View>

                {!isPaid && (
                  <Button
                    title="Pay Now"
                    onPress={() => handlePayInvoice(inv.id)}
                    loading={isPaying}
                    variant="primary"
                    icon={<Ionicons name="card-outline" size={16} color={colors.textLight} />}
                    style={styles.payButton}
                  />
                )}
              </View>
            </Card>
          );
        })
      )}

      {/* Active Projects Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ProjectsTab")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="briefcase-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyCardTitle}>No Active Projects</Text>
          <Text style={styles.emptyCardSub}>Active technology engagements and project sprints will appear here.</Text>
        </Card>
      ) : (
        projects.slice(0, 3).map((proj: Project) => (
          <Card key={proj.id} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{proj.name}</Text>
              <Badge label={(proj.status || "active").replace("_", " ")} variant="info" />
            </View>
            {proj.description && (
              <Text style={styles.projectDesc} numberOfLines={2}>
                {proj.description}
              </Text>
            )}
            <View style={styles.projectFooter}>
              <View style={styles.projectMeta}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={styles.projectMetaText}>
                  {proj.deadline ? `Target: ${proj.deadline}` : "Ongoing Scope"}
                </Text>
              </View>
            </View>
          </Card>
        ))
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
    padding: 16,
    paddingBottom: 32,
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
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  welcomeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
  },
  gstinText: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: colors.textMuted,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionBtn: {
    alignItems: "center",
    flex: 1,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  emptyCardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 240,
  },
  invoiceCard: {
    marginBottom: 10,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  invoiceDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  invoiceBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceAmountLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  payButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  projectCard: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  projectName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  projectDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  projectFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  projectMetaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
