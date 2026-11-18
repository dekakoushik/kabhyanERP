import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { portalApi, Project } from "../../api/portal";
import { formatDate } from "../../utils/date";

export const ProjectDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await portalApi.getProject(projectId);
        setProject(res.project);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load project details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading || !project) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const deliverables = project.deliverables || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.topRow}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Badge label={(project.status || "active").replace("_", " ")} variant="info" />
        </View>

        {project.code && <Text style={styles.projectCode}>Project Code: {project.code}</Text>}
        {project.description && <Text style={styles.desc}>{project.description}</Text>}

        <View style={styles.divider} />

        <View style={styles.timelineRow}>
          <View>
            <Text style={styles.metaLabel}>Start Date</Text>
            <Text style={styles.metaValue}>{project.start_date ? formatDate(project.start_date) : "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Target Deadline</Text>
            <Text style={styles.metaValue}>{project.deadline ? formatDate(project.deadline) : "Ongoing"}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Deliverables</Text>
      </View>

      {deliverables.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No deliverables yet</Text>
          <Text style={styles.emptySub}>
            Project deliverables will appear here.
          </Text>
        </Card>
      ) : (
        deliverables.map((item, idx) => (
          <Card key={item.id || idx} style={styles.deliverableCard}>
            <View style={styles.deliverableRow}>
              <Ionicons
                name={
                  item.status === "completed"
                    ? "checkmark-circle"
                    : item.status === "in_progress"
                    ? "sync-circle-outline"
                    : "ellipse-outline"
                }
                size={20}
                color={
                  item.status === "completed"
                    ? colors.success
                    : item.status === "in_progress"
                    ? colors.primary
                    : colors.textMuted
                }
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.deliverableTitle}>{item.title}</Text>
                {item.due_date && (
                  <Text style={styles.deliverableDate}>Target: {item.due_date}</Text>
                )}
              </View>
              <Badge
                label={(item.status || "pending").replace("_", " ")}
                variant={
                  item.status === "completed"
                    ? "success"
                    : item.status === "in_progress"
                    ? "info"
                    : "neutral"
                }
              />
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerCard: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  projectCode: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  deliverableCard: {
    marginBottom: 8,
    padding: 14,
  },
  deliverableRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliverableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  deliverableDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 260,
  },
});
