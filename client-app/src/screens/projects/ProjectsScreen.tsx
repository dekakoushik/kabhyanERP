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
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { portalApi, Project } from "../../api/portal";
import { formatDate } from "../../utils/date";

export const ProjectsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await portalApi.getProjects();
      const data = Array.isArray(res.projects)
        ? res.projects
        : (res.projects as any)?.data || [];
      setProjects(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const isCompleted = item.status === "completed";
    const pendingDocRequests = (item.file_requests || []).filter(
      (r) => r.status === "pending" || r.status === "rejected"
    );
    const underReviewDocRequests = (item.file_requests || []).filter(
      (r) => r.status === "submitted"
    );

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.projectName}>{item.name}</Text>
              {item.code && <Text style={styles.projectCode}>Code: {item.code}</Text>}
            </View>
            <Badge
              label={(item.status || "active").replace("_", " ")}
              variant={isCompleted ? "success" : item.status === "in_progress" ? "info" : "neutral"}
            />
          </View>

          {item.description && (
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {pendingDocRequests.length > 0 ? (
            <View style={styles.actionNoticeRow}>
              <Ionicons name="alert-circle" size={13} color={colors.warning} />
              <Text style={styles.actionNoticeText}>
                Action Required: {pendingDocRequests.length} document{pendingDocRequests.length > 1 ? "s" : ""} requested — Upload files
              </Text>
            </View>
          ) : underReviewDocRequests.length > 0 ? (
            <View style={styles.infoNoticeRow}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.infoNoticeText}>
                {underReviewDocRequests.length} document{underReviewDocRequests.length > 1 ? "s" : ""} under review by lead
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <View style={styles.metaCol}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {item.deadline ? `Due: ${formatDate(item.deadline)}` : "Ongoing"}
              </Text>
            </View>

            <View style={styles.viewLink}>
              <Text style={styles.viewLinkText}>
                {item.show_tasks_to_client !== false ? "Deliverables" : "Workspace"}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProjectCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="No Projects Found"
              description="You do not have any active projects or engineering contracts registered yet."
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  projectName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  projectCode: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
    marginTop: 2,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  actionNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
  },
  actionNoticeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.warning,
    flex: 1,
  },
  infoNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.infoBg,
    borderColor: colors.infoBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
  },
  infoNoticeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.primary,
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewLinkText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
});
