import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { portalApi } from "../../api/portal";

export const CreateTicketScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Incomplete", "Please provide both a ticket subject and a detailed message.");
      return;
    }

    try {
      setSubmitting(true);
      await portalApi.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      Alert.alert("Success", "Your support ticket has been registered. An engineer will follow up shortly.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>New Support Ticket</Text>
        <Text style={styles.subtitle}>
          Submit inquiries, milestone feedback, or technical assistance requests.
        </Text>

        {/* Priority Selection */}
        <Text style={styles.label}>Priority Level</Text>
        <View style={styles.priorityRow}>
          {(["low", "medium", "high", "urgent"] as const).map((p) => {
            const isSelected = priority === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityBtn,
                  isSelected && styles.priorityBtnActive,
                  isSelected && p === "urgent" && styles.priorityBtnUrgent,
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    isSelected && styles.priorityTextActive,
                    isSelected && p === "urgent" && styles.priorityTextUrgent,
                  ]}
                >
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subject Input */}
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief summary of the issue or requirement"
          placeholderTextColor={colors.textMuted}
          value={subject}
          onChangeText={setSubject}
        />

        {/* Message Input */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your request in detail, including steps, URLs, or deliverables involved..."
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {/* Submit */}
        <Button
          title="Submit Ticket"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  priorityBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityBtnUrgent: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  priorityTextActive: {
    color: colors.textLight,
  },
  priorityTextUrgent: {
    color: colors.textLight,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
  },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 14,
  },
});
