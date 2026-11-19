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

  // Filtered tickets based on search query and status tab
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

  // Clean compact status badge
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
    const replies = item.replies_count || (item.replies ? item.replies.length : 0);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate("TicketDetail", { ticketId: item.id })}
      >
        <Card style={styles.ticketCard}>
          {/* Top Row: Ticket ID + Priority Indicator | Status Badge */}
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
              <Ionicons name="briefcase-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.projectName} numberOfLines={1}>
                {item.project.name}
              </Text>
            </View>
          ) : null}

          {/* Hairline Divider */}
          <View style={styles.cardDivider} />

          {/* Footer: Date & Updates Count | Chevron */}
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
      {/* Compact Search & Filter Control Bar */}
      <View style={styles.controlHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets by #, subject, or project..."
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

        {/* Compact Segmented Filter Tabs */}
        <View style={styles.filterTabsRow}>
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
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
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
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
                  ? `No tickets match "${searchQuery}". Clear your search to view all records.`
                  : "You have no support tickets under this status. Tap '+ New' in the top bar to raise a ticket."
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
  controlHeader: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12.5,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 6,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  filterCountBadge: {
    backgroundColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
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
    padding: 12,
    paddingBottom: 100, // Safe clearance for bottom tab bar
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  ticketCard: {
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    backgroundColor: colors.card,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  idGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  ticketIdText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  urgentPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    gap: 3.5,
  },
  urgentText: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    color: colors.danger,
    letterSpacing: 0.4,
  },
  highPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 3.5,
  },
  highText: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    color: "#EA580C",
    letterSpacing: 0.4,
  },
  priorityDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
  },
  subject: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    marginVertical: 8,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerMetaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    fontSize: 9,
    color: colors.textMuted,
  },
});
