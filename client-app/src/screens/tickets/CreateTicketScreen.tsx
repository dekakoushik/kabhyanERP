import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { portalApi } from "../../api/portal";

/**
 * Intelligent priority resolution deduced automatically from ticket subject and context.
 * Clients are not given manual priority selectors to avoid bias and ensure objective SLAs.
 */
function deducePriority(subject: string, message: string): "low" | "medium" | "high" | "urgent" {
  const text = (subject + " " + message).toLowerCase();
  if (/\b(urgent|critical|emergency|down|outage|crash|blocker|fatal|production)\b/.test(text)) {
    return "urgent";
  }
  if (/\b(error|bug|broken|failed|failure|issue|cannot|not working|problem|glitch)\b/.test(text)) {
    return "high";
  }
  if (/\b(inquiry|question|info|query|clarification|how to|feedback)\b/.test(text)) {
    return "low";
  }
  return "medium";
}

export const CreateTicketScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Incomplete", "Please provide both a ticket subject and a detailed description.");
      return;
    }

    try {
      setSubmitting(true);
      const priority = deducePriority(subject, message);
      await portalApi.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        description: message.trim(),
        type: "query",
        priority,
      });

      Alert.alert(
        "Ticket Registered",
        "Your support ticket has been registered. Our engineering team has been notified and will follow up shortly.",
        [
          {
            text: "View Tickets",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.title}>New Support Ticket</Text>
          <Text style={styles.subtitle}>
            Submit technical assistance requests, inquiries, or feedback. Priority and routing will be assessed automatically.
          </Text>

          {/* Subject Input */}
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of your request or issue..."
            placeholderTextColor="#64748B"
            value={subject}
            onChangeText={setSubject}
            returnKeyType="next"
            autoCapitalize="sentences"
          />

          {/* Detailed Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your request in detail, including deliverables, URLs, or steps involved..."
            placeholderTextColor="#64748B"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Submit Action */}
          <Button
            title="Submit Ticket"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 110,
  },
  submitBtn: {
    marginTop: 4,
    paddingVertical: 12,
  },
});
