import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Badge } from "../../components/Badge";
import { portalApi, SupportTicket, TicketReplyItem } from "../../api/portal";
import { formatDate } from "../../utils/date";
import { getEcho } from "../../utils/echo";

interface UnifiedMessageItem {
  id: string;
  isInitial: boolean;
  isStaff: boolean;
  senderName: string;
  message: string;
  createdAt: string;
}

export const TicketDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchTicket = async () => {
    try {
      const res = await portalApi.getTicket(ticketId);
      setTicket(res.ticket);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load support ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // Set navigation header title to clean ticket number
  useEffect(() => {
    if (ticket) {
      navigation.setOptions({
        title: `#${ticket.ticket_number || ticket.id}`,
      });
    }
  }, [ticket, navigation]);

  // Real-Time Reverb Live Chat Listener for Support Ticket
  useEffect(() => {
    let activeChannel: any = null;

    getEcho().then((echo) => {
      if (!echo) return;
      activeChannel = echo
        .private(`ticket.${ticketId}`)
        .listen(".TicketReplyCreated", (data: any) => {
          setTicket((prev: any) => {
            if (!prev) return prev;
            const existingReplies = (prev.replies || []) as TicketReplyItem[];
            const exists = existingReplies.some((r) => r.id === data.reply?.id);
            if (exists) return prev;
            return {
              ...prev,
              status: data.status || prev.status,
              replies: [...existingReplies, data.reply],
            };
          });
          // Scroll to bottom on new message
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 200);
        });
    });

    return () => {
      if (activeChannel) {
        try {
          activeChannel.stopListening(".TicketReplyCreated");
        } catch (e) {
          // Safe ignore
        }
      }
    };
  }, [ticketId]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    const messageContent = replyText.trim();
    try {
      setSending(true);
      const res = await portalApi.replyTicket(ticketId, messageContent);
      setReplyText("");
      if (res.ticket) {
        setTicket(res.ticket);
      } else {
        fetchTicket();
      }
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send message reply.");
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading ticket discussion...</Text>
      </View>
    );
  }

  // Build unified thread list: initial description + all replies
  const threadMessages: UnifiedMessageItem[] = [];

  // 1. Initial Request (if description exists)
  if (ticket.description) {
    threadMessages.push({
      id: `initial-${ticket.id}`,
      isInitial: true,
      isStaff: false,
      senderName: "You (Original Request)",
      message: ticket.description,
      createdAt: ticket.created_at,
    });
  }

  // 2. Replies (from both staff and client)
  const replies = ticket.replies || (ticket.messages as any) || [];
  replies.forEach((r: any) => {
    const isStaff = Boolean(r.is_staff_reply || r.sender_type === "staff");
    const senderName = isStaff
      ? r.staff?.name || "Kabhyan Support"
      : "You";
    threadMessages.push({
      id: String(r.id),
      isInitial: false,
      isStaff,
      senderName,
      message: r.message,
      createdAt: r.created_at,
    });
  });

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

  const isUrgent = ticket.priority === "urgent" || ticket.priority === "critical";
  const isHigh = ticket.priority === "high";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.container}
    >
      {/* Compact Ticket Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.idGroup}>
            <Text style={styles.ticketIdText}>
              #{ticket.ticket_number || ticket.id}
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
          {renderStatusBadge(ticket.status)}
        </View>

        <Text style={styles.subjectText}>{ticket.subject}</Text>

        {/* Linked Project / Assignee Row */}
        <View style={styles.metaRow}>
          {ticket.project?.name ? (
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.metaValue} numberOfLines={1}>
                {ticket.project.name}
              </Text>
            </View>
          ) : null}

          {ticket.project?.name && ticket.assignee?.name ? (
            <Text style={styles.metaBullet}>•</Text>
          ) : null}

          {ticket.assignee?.name ? (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.metaValue} numberOfLines={1}>
                Assigned: {ticket.assignee.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Messages Thread */}
      <FlatList
        ref={flatListRef}
        data={threadMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isMe = !item.isStaff;
          return (
            <View
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowStaff,
              ]}
            >
              {/* Sender Name & Badge */}
              <View
                style={[
                  styles.senderHeader,
                  isMe ? styles.senderHeaderMe : styles.senderHeaderStaff,
                ]}
              >
                <Text style={styles.senderNameText}>{item.senderName}</Text>
                {item.isStaff && (
                  <View style={styles.staffTag}>
                    <Text style={styles.staffTagText}>TEAM</Text>
                  </View>
                )}
              </View>

              {/* Message Bubble */}
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubbleStaff,
                  item.isInitial && styles.bubbleInitial,
                ]}
              >
                <Text
                  style={[
                    styles.messageBody,
                    isMe ? styles.messageBodyMe : styles.messageBodyStaff,
                  ]}
                >
                  {item.message}
                </Text>
              </View>

              {/* Timestamp */}
              <Text
                style={[
                  styles.timestampText,
                  isMe ? styles.timestampMe : styles.timestampStaff,
                ]}
              >
                {formatDate(item.createdAt)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Updates Yet</Text>
            <Text style={styles.emptySubtitle}>
              Send a reply below to reach our engineering support team.
            </Text>
          </View>
        }
      />

      {/* Bottom Sticky Reply Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a reply to engineering..."
          placeholderTextColor={colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={handleSendReply}
          disabled={sending || !replyText.trim()}
          style={[
            styles.sendBtn,
            (!replyText.trim() || sending) && styles.sendBtnDisabled,
          ]}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={15} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerCard: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  idGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ticketIdText: {
    fontFamily: fonts.bold,
    fontSize: 12,
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
  subjectText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaValue: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  metaBullet: {
    fontSize: 9,
    color: colors.textMuted,
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  messageRow: {
    marginBottom: 12,
    maxWidth: "84%",
  },
  messageRowMe: {
    alignSelf: "flex-end",
  },
  messageRowStaff: {
    alignSelf: "flex-start",
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  senderHeaderMe: {
    justifyContent: "flex-end",
  },
  senderHeaderStaff: {
    justifyContent: "flex-start",
  },
  senderNameText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  staffTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  staffTagText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 3,
  },
  bubbleStaff: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 3,
  },
  bubbleInitial: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  messageBody: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  messageBodyMe: {
    color: colors.textLight,
  },
  messageBodyStaff: {
    color: colors.text,
  },
  timestampText: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  timestampMe: {
    textAlign: "right",
  },
  timestampStaff: {
    textAlign: "left",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 90,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
});
