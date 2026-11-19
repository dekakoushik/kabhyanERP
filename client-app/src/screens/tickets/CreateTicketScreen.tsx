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
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { portalApi, ChosenAttachment } from "../../api/portal";

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
  const [attachments, setAttachments] = useState<ChosenAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    if (attachments.length >= 3) {
      Alert.alert("Limit Reached", "You can attach up to 3 images per ticket.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename =
          asset.fileName || asset.uri.split("/").pop() || `ticket_img_${Date.now()}.jpg`;

        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: filename,
            type: asset.mimeType || "image/jpeg",
          },
        ]);
      }
    } catch {
      Alert.alert("Error", "Could not access image library.");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Incomplete", "Please provide both a ticket subject and a detailed description.");
      return;
    }

    try {
      setSubmitting(true);
      const priority = deducePriority(subject, message);

      await portalApi.createTicket(
        {
          subject: subject.trim(),
          message: message.trim(),
          description: message.trim(),
          type: "query",
          priority,
        },
        attachments
      );

      Alert.alert(
        "Ticket Registered",
        "Your support ticket and attachments have been registered. Our engineering team has been notified.",
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
            Submit technical assistance requests, inquiries, or feedback. Priority and routing are assessed automatically.
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

          {/* Image Attachments */}
          <View style={styles.attachmentHeader}>
            <Text style={styles.label}>Screenshots & Images (Optional)</Text>
            <Text style={styles.attachmentCountText}>{attachments.length}/3</Text>
          </View>

          <View style={styles.attachmentStrip}>
            {attachments.map((att, idx) => (
              <View key={att.uri} style={styles.thumbnailWrapper}>
                <Image source={{ uri: att.uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeThumbnailBtn}
                  onPress={() => removeAttachment(idx)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={11} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {attachments.length < 3 && (
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.addImageText}>+ Add Image</Text>
              </TouchableOpacity>
            )}
          </View>

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
  attachmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  attachmentCountText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  attachmentStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  thumbnailWrapper: {
    position: "relative",
    width: 68,
    height: 68,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  removeThumbnailBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBtn: {
    width: 90,
    height: 68,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.primary,
  },
  submitBtn: {
    marginTop: 4,
    paddingVertical: 12,
  },
});
