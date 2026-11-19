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
import { EmptyState } from "../../components/EmptyState";
import { portalApi, SupportTicket } from "../../api/portal";
import { formatDate } from "../../utils/date";

type StatusFilter = "all" | "open" | "resolved";

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

  // Counts for filter tabs
  const counts = useMemo(() => {
    const open = tickets.filter(
      (t) => t.status !== "resolved" && t.status !== "closed"
    ).length;
    const resolved = tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length;
    return { all: tickets.length, open, resolved };
  }, [tickets]);

  // Filtered tickets based on search and status filter
  const filteredTickets = useMemo(() => {
    return tickets.filter((item) => {
      if (statusFilter === "open") {
        if (item.status === "resolved" || item.status === "closed") return false;
      } else if (statusFilter === "resolved") {
        if (item.status !== "resolved" && item.status !== "closed") return false;
      }

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

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    const s = (status || "open").toLowerCase();
    switch (s) {
      case "resolved":
      case "closed":
        return <Badge label="RESOLVED" variant="success" size="sm" />;
      case "in_progress":
        return <Badge label="IN PROGRESS" variant="info" size="sm" />;
      case "awaiting_client_reply":
        return <Badge label="AWAITING REPLY" variant="purple" size="sm" />;
      default:
        return <Badge label="OPEN" variant="warning" size="sm" />;
    }
  };

  const renderTicketCard = ({ item }: { item: SupportTicket }) => {
    const isUrgent = item.priority === "urgent" || item.priority === "critical";
    const isHigh = item.priority === "high";
    const replies = item.replies_count || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate("TicketDetail", { ticketId: item.id })}
      >
        <Card style={styles.ticketCard}>
          {/* Card Top Row: Ticket ID + Priority (Left) | Status Badge (Right) */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.idGroup}>
              <Text style={styles.ticketIdText}>
                #{item.ticket_number || item.id}
              </Text>
              {isUrgent ? (
                <View style={styles.urgentPill}>
                  <View style={[styles.priorityDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              ) : isHigh ? (
                <View style={styles.highPill}>
                  <View style={[styles.priorityDot, { backgroundColor: "#EA580C" }]} />
                  <Text style={styles.highText}>HIGH</Text>
                </View>
              ) : null}
            </View>

            {renderStatusBadge(item.status)}
          </View>

          {/* Ticket Subject */}
          <Text style={styles.subject} numberOfLines={2}>
            {item.subject}
          </Text>

          {/* Linked Project (Optional) */}
          {item.project?.name ? (
            <View style={styles.projectRow}>
              <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.projectName} numberOfLines={1}>
                {item.project.name}
              </Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Card Footer: Date & Replies (Left) | Chevron (Right) */}
          <View style={styles.cardFooterRow}>
            <View style={styles.footerMetaGroup}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
              </View>

              <Text style={styles.metaBullet}>•</Text>

              <View style={styles.metaItem}>
                <Ionicons
                  name={replies > 0 ? "chatbubble-ellipses" : "chatbubble-outline"}
                  size={12}
                  color={replies > 0 ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.metaText,
                    replies > 0 && { color: colors.primary, fontFamily: fonts.medium },
                  ]}
                >
                  {replies > 0
                    ? `${replies} ${replies === 1 ? "update" : "updates"}`
                    : "No updates yet"}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Crisp Top Action Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Support</Text>
          {counts.open > 0 ? (
            <View style={styles.openCounterPill}>
              <Text style={styles.openCounterText}>{counts.open} open</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.newTicketBtn}
          onPress={() => navigation.navigate("CreateTicket")}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newTicketBtnText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      {/* Clean Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets by # or subject..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Segmented Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        {(
          [
            { key: "all", label: "All", count: counts.all },
            { key: "open", label: "Open", count: counts.open },
            { key: "resolved", label: "Resolved", count: counts.resolved },
          ] as const
        ).map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.filterCountBadge,
                  isActive && styles.filterCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    isActive && styles.filterCountTextActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="help-buoy-outline"
              title={
                searchQuery
                  ? "No Matching Tickets"
                  : statusFilter === "open"
                  ? "No Open Tickets"
                  : statusFilter === "resolved"
                  ? "No Resolved Tickets"
                  : "No Support Tickets"
              }
              description={
                searchQuery
                  ? `No tickets match "${searchQuery}". Clear your search to see all records.`
                  : "You have no tickets under this filter. Tap '+ New Ticket' above to request engineering support."
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.card,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
  },
  openCounterPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  openCounterText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  newTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  newTicketBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textLight,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
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
    fontFamily: fonts.regular,
  },
  filterTabsContainer: {
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
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
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
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
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
  ticketCard: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  idGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  ticketIdText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  urgentPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    gap: 4,
  },
  urgentText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.danger,
    letterSpacing: 0.5,
  },
  highPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 4,
  },
  highText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#EA580C",
    letterSpacing: 0.5,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  subject: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 4,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  projectName: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerMetaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  metaBullet: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
