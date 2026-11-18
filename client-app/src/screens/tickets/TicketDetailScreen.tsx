import React, { useEffect, useState } from "react";
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
import { portalApi, SupportTicket, TicketMessage } from "../../api/portal";

export const TicketDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await portalApi.getTicket(ticketId);
      setTicket(res.ticket);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      setSending(true);
      await portalApi.replyTicket(ticketId, replyText.trim());
      setReplyText("");
      fetchTicket();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading ticket discussion...</Text>
      </View>
    );
  }

  const messages = ticket.messages || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.container}
    >
      {/* Top Details Card */}
      <View style={styles.headerBox}>
        <View style={styles.headerRow}>
          <Text style={styles.ticketNum}>#{ticket.ticket_number || ticket.id}</Text>
          <Badge label={(ticket.status || "open").replace("_", " ")} variant="info" />
        </View>
        <Text style={styles.subject}>{ticket.subject}</Text>
      </View>

      {/* Messages Thread */}
      <FlatList
        data={messages}
        keyExtractor={(item, idx) => String(item.id || idx)}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }: { item: TicketMessage }) => {
          const isClient = item.sender_type === "client";
          return (
            <View
              style={[
                styles.bubbleWrapper,
                isClient ? styles.bubbleRight : styles.bubbleLeft,
              ]}
            >
              <Text style={styles.senderName}>
                {item.sender_name || (isClient ? "You" : "Kabhyan Support")}
              </Text>
              <View
                style={[
                  styles.bubble,
                  isClient ? styles.bubbleClient : styles.bubbleStaff,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isClient ? styles.msgTextClient : styles.msgTextStaff,
                  ]}
                >
                  {item.message}
                </Text>
              </View>
              <Text style={styles.timeText}>{item.created_at || "Just now"}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>No message updates recorded yet.</Text>
          </View>
        }
      />

      {/* Reply Input Bar */}
      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Type your message..."
          placeholderTextColor={colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity
          onPress={handleSendReply}
          disabled={sending || !replyText.trim()}
          style={[
            styles.sendButton,
            (!replyText.trim() || sending) && styles.sendButtonDisabled,
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.textLight} />
          ) : (
            <Ionicons name="send" size={16} color={colors.textLight} />
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ticketNum: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  subject: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    marginBottom: 14,
    maxWidth: "80%",
  },
  bubbleLeft: {
    alignSelf: "flex-start",
  },
  bubbleRight: {
    alignSelf: "flex-end",
  },
  senderName: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 3,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleClient: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleStaff: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextClient: {
    color: colors.textLight,
  },
  msgTextStaff: {
    color: colors.text,
  },
  timeText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    alignSelf: "flex-end",
  },
  emptyMessages: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
