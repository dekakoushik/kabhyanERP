import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { portalApi, SupportTicket } from "../../api/portal";

export const TicketsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await portalApi.getTickets();
      setTickets(res.tickets || []);
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

  const renderTicketCard = ({ item }: { item: SupportTicket }) => {
    const isClosed = item.status === "closed" || item.status === "resolved";

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("TicketDetail", { ticketId: item.id })}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.ticketNumber}>#{item.ticket_number || item.id}</Text>
              <Text style={styles.subject}>{item.subject}</Text>
            </View>
            <Badge
              label={item.status.replace("_", " ")}
              variant={isClosed ? "success" : item.status === "in_progress" ? "info" : "warning"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <View style={styles.priorityBox}>
              <Text style={styles.priorityLabel}>Priority:</Text>
              <Text style={[styles.priorityValue, item.priority === "urgent" && { color: colors.danger }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>

            <View style={styles.chatLink}>
              <Text style={styles.chatLinkText}>View Thread</Text>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Support Desk</Text>
          <Text style={styles.topSubtitle}>Direct assistance from Kabhyan IT engineering</Text>
        </View>
        <Button
          title="+ New Ticket"
          onPress={() => navigation.navigate("CreateTicket")}
          style={styles.newTicketBtn}
          textStyle={{ fontSize: 12 }}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="help-buoy-outline"
              title="No Support Tickets"
              description="You do not have any open tickets. If you need technical assistance or sprint requests, raise a new ticket above."
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  topSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  newTicketBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
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
  card: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketNumber: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  subject: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
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
  priorityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priorityLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priorityValue: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  chatLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
});
