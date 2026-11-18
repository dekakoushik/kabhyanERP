import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { portalApi, SupportTicket } from "../../api/portal";

type StatusFilter = "all" | "active" | "resolved";

export const TicketsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await portalApi.getTickets();
      const data = Array.isArray(res.tickets)
        ? res.tickets
        : (res.tickets as any)?.data || [];
      setTickets(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  // Counts for filter pills
  const counts = useMemo(() => {
    const active = tickets.filter(
      (t) => t.status !== "resolved" && t.status !== "closed"
    ).length;
    const resolved = tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length;
    return { all: tickets.length, active, resolved };
  }, [tickets]);

  // Filtered tickets based on search and status filter
  const filteredTickets = useMemo(() => {
    return tickets.filter((item) => {
      // Status filter
      if (statusFilter === "active") {
        if (item.status === "resolved" || item.status === "closed") return false;
      } else if (statusFilter === "resolved") {
        if (item.status !== "resolved" && item.status !== "closed") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = (item.ticket_number || "").toLowerCase().includes(query);
        const matchesSubject = (item.subject || "").toLowerCase().includes(query);
        const matchesProject = (item.project?.name || "").toLowerCase().includes(query);
        if (!matchesNumber && !matchesSubject && !matchesProject) return false;
      }

      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  // Priority color helper
  const getPriorityInfo = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
      case "critical":
        return { label: "URGENT", dotColor: colors.danger, bg: "#FEF2F2", text: "#991B1B" };
      case "high":
        return { label: "HIGH", dotColor: "#EA580C", bg: "#FFF7ED", text: "#9A3412" };
      case "medium":
        return { label: "MEDIUM", dotColor: colors.primary, bg: colors.primaryLight, text: colors.primary };
      default:
        return { label: "LOW", dotColor: colors.textMuted, bg: colors.background, text: colors.textSecondary };
    }
  };

  // Status badge variant helper
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "closed":
        return "success";
      case "in_progress":
        return "info";
      case "awaiting_client_reply":
        return "purple";
      default:
        return "warning";
    }
  };

  const renderTicketCard = ({ item }: { item: SupportTicket }) => {
    const priority = getPriorityInfo(item.priority);
    const statusVariant = getStatusVariant(item.status);
    const dateFormatted = item.created_at
      ? new Date(item.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recent";

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("TicketDetail", { ticketId: item.id })}
        >
          {/* Card Top Row: Ticket ID + Project Badge + Status Badge */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.idGroup}>
              <View style={styles.ticketIdBadge}>
                <Text style={styles.ticketIdText}>#{item.ticket_number || item.id}</Text>
              </View>
              {item.project?.name && (
                <View style={styles.projectBadge}>
                  <Text style={styles.projectBadgeText} numberOfLines={1}>
                    {item.project.code || item.project.name}
                  </Text>
                </View>
              )}
            </View>

            <Badge
              label={(item.status || "open").replace("_", " ").toUpperCase()}
              variant={statusVariant}
            />
          </View>

          {/* Ticket Subject */}
          <Text style={styles.subject} numberOfLines={2}>
            {item.subject}
          </Text>

          {/* Meta Info: Category & Date */}
          <View style={styles.metaRow}>
            {item.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type.replace("_", " ").toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.dateText}>Opened on {dateFormatted}</Text>
          </View>

          <View style={styles.divider} />

          {/* Footer: Priority + Replies Count + View Action */}
          <View style={styles.cardFooterRow}>
            <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}>
              <View style={[styles.priorityDot, { backgroundColor: priority.dotColor }]} />
              <Text style={[styles.priorityText, { color: priority.text }]}>
                {priority.label}
              </Text>
            </View>

            {item.replies_count !== undefined && item.replies_count > 0 ? (
              <View style={styles.repliesGroup}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.repliesText}>
                  {item.replies_count} {item.replies_count === 1 ? "update" : "updates"}
                </Text>
              </View>
            ) : (
              <Text style={styles.noRepliesText}>Engineering Review</Text>
            )}

            <View style={styles.chatLink}>
              <Text style={styles.chatLinkText}>View Thread</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Support Hero Header Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconBox}>
            <Ionicons name="headset" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heroTitle}>Engineering Support Desk</Text>
            <Text style={styles.heroSubtitle}>
              Dedicated technical assistance for your deliverables.
            </Text>
          </View>
          <Button
            title="+ New Ticket"
            onPress={() => navigation.navigate("CreateTicket")}
            style={styles.heroNewBtn}
            textStyle={{ fontSize: 12 }}
          />
        </View>

        {/* SLA Notice */}
        <View style={styles.slaNoticeRow}>
          <View style={styles.onlinePulseDot} />
          <Text style={styles.slaNoticeText}>
            Dedicated Engineers Active • Typical Response &lt; 2 Hours
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ticket # or subject..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(
          [
            { key: "all", label: "All Tickets", count: counts.all },
            { key: "active", label: "Active", count: counts.active },
            { key: "resolved", label: "Resolved", count: counts.resolved },
          ] as const
        ).map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching support inquiries...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="help-buoy-outline"
              title={
                searchQuery
                  ? "No Matching Tickets"
                  : statusFilter === "active"
                  ? "No Active Inquiries"
                  : statusFilter === "resolved"
                  ? "No Resolved Tickets"
                  : "No Support Tickets"
              }
              description={
                searchQuery
                  ? `No tickets match "${searchQuery}". Clear your search query to see all tickets.`
                  : "You have no support inquiries registered under this status. Tap '+ New Ticket' above if you need assistance."
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
  heroCard: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroNewBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  slaNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
  },
  onlinePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  slaNoticeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.card,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },
  filterTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  filterCountBadge: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textSecondary,
  },
  filterCountTextActive: {
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  idGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  ticketIdBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketIdText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  projectBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 120,
  },
  projectBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textSecondary,
  },
  subject: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#475569",
    letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 10,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  repliesGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repliesText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  noRepliesText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  chatLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  chatLinkText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
});
