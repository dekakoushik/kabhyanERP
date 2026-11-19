import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { portalApi, Project, ProjectFileRequest } from "../../api/portal";
import { formatDate } from "../../utils/date";
import { getEcho } from "../../utils/echo";

export const ProjectDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

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

  // Real-Time Reverb WebSocket Channel Listener
  useEffect(() => {
    let activeChannel: any = null;

    getEcho().then((echo) => {
      if (!echo) return;
      activeChannel = echo
        .private(`project.${projectId}`)
        .listen(".ProjectFileRequestCreated", (data: any) => {
          setProject((prev: any) => {
            if (!prev) return prev;
            const existing = (prev.file_requests || []) as ProjectFileRequest[];
            const exists = existing.some((r) => r.id === data.file_request?.id);
            if (exists) return prev;
            return {
              ...prev,
              file_requests: [data.file_request, ...existing],
            };
          });
        })
        .listen(".ProjectFileRequestUpdated", (data: any) => {
          setProject((prev: any) => {
            if (!prev) return prev;
            const existing = (prev.file_requests || []) as ProjectFileRequest[];
            return {
              ...prev,
              file_requests: existing.map((r) =>
                r.id === data.file_request?.id ? data.file_request : r
              ),
            };
          });
        })
        .listen(".ProjectTaskVisibilityToggled", (data: any) => {
          setProject((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              show_tasks_to_client: data.show_tasks_to_client,
            };
          });
        });
    });

    return () => {
      if (activeChannel) {
        try {
          activeChannel.stopListening(".ProjectFileRequestCreated");
          activeChannel.stopListening(".ProjectFileRequestUpdated");
          activeChannel.stopListening(".ProjectTaskVisibilityToggled");
        } catch (e) {
          // Safe ignore
        }
      }
    };
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
  const fileRequests: ProjectFileRequest[] = (project as any).file_requests || [];
  const showTasks = project.show_tasks_to_client !== false;

  const handlePickAndUpload = async (req: ProjectFileRequest) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const file = res.assets[0];
      setUploadingId(req.id);

      const response = await portalApi.uploadFileRequest(projectId, req.id, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      });
      Alert.alert("Success", "Document uploaded successfully. It is now under review.");

      // Update state locally
      setProject((prev: any) => {
        if (!prev) return prev;
        const updatedRequests = ((prev.file_requests || []) as ProjectFileRequest[]).map((item) =>
          item.id === req.id ? response.file_request : item
        );
        return { ...prev, file_requests: updatedRequests };
      });
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Failed to upload document file.");
    } finally {
      setUploadingId(null);
    }
  };

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

      {/* SECTION 1: REQUESTED DOCUMENTS (ONLY SHOWN IF DOCUMENTS ARE REQUESTED) */}
      {fileRequests.length > 0 && (
        <View style={{ marginBottom: 4 }}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Requested Documents</Text>
              <Badge label={`${fileRequests.length}`} variant="neutral" />
            </View>
          </View>

          {fileRequests.map((req) => {
            const isApproved = req.status === "approved";
            const isSubmitted = req.status === "submitted";
            const isRejected = req.status === "rejected";

            return (
              <Card key={req.id} style={styles.docCard}>
                <View style={styles.docTopRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.docTitle}>{req.title}</Text>
                    {req.due_date && (
                      <Text style={styles.docDueText}>Due: {formatDate(req.due_date)}</Text>
                    )}
                  </View>
                  <Badge
                    label={
                      isApproved
                        ? "Approved"
                        : isSubmitted
                        ? "In Review"
                        : isRejected
                        ? "Revision Needed"
                        : "Awaiting Upload"
                    }
                    variant={
                      isApproved
                        ? "success"
                        : isSubmitted
                        ? "info"
                        : isRejected
                        ? "danger"
                        : "warning"
                    }
                  />
                </View>

                {req.description && (
                  <Text style={styles.docDesc}>{req.description}</Text>
                )}

                {req.file_type_allowed && (
                  <Text style={styles.docFormat}>
                    Format: {req.file_type_allowed}
                  </Text>
                )}

                {req.review_notes && isRejected && (
                  <View style={styles.revisionBox}>
                    <Text style={styles.revisionTitle}>Revision Notes:</Text>
                    <Text style={styles.revisionText}>{req.review_notes}</Text>
                  </View>
                )}

                {req.file_name && (
                  <View style={styles.uploadedFileRow}>
                    <Ionicons name="attach" size={16} color={colors.primary} />
                    <Text style={styles.uploadedFileName} numberOfLines={1}>
                      {req.file_name}
                    </Text>
                  </View>
                )}

                {!isApproved && (
                  <TouchableOpacity
                    style={[styles.uploadBtn, uploadingId === req.id && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    disabled={uploadingId === req.id}
                    onPress={() => handlePickAndUpload(req)}
                  >
                    {uploadingId === req.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={15} color="#fff" />
                    )}
                    <Text style={styles.uploadBtnText}>Upload Files</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* SECTION 2: DELIVERABLES */}
      <View style={[styles.sectionHeader, { marginTop: fileRequests.length > 0 ? 12 : 4 }]}>
        <Text style={styles.sectionTitle}>Deliverables</Text>
      </View>

      {showTasks ? (
        deliverables.length === 0 ? (
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
        )
      ) : (
        <Card style={styles.internalCoordCard}>
          <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.internalCoordText}>
            Sprint tasks and technical engineering milestones are managed internally by the project lead. Check requested documents above for deliverable handoffs.
          </Text>
        </Card>
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
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
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
    maxWidth: 280,
  },
  docCard: {
    marginBottom: 10,
    padding: 14,
  },
  docTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  docDueText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  docDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 6,
  },
  docFormat: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  revisionBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 10,
  },
  revisionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b91c1c",
    marginBottom: 2,
  },
  revisionText: {
    fontSize: 12,
    color: "#7f1d1d",
  },
  uploadedFileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  uploadedFileName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  internalCoordCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  internalCoordText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
});
