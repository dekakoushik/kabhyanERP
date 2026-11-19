import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { portalApi, ClientProfile } from "../../api/portal";
import { useAuth } from "../../context/AuthContext";
import { logger } from "../../utils/logger";
import { getUpdateMetadata, checkAppUpdate } from "../../utils/updates";

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const updateMeta = getUpdateMetadata();

  useEffect(() => {
    async function load() {
      try {
        const res = await portalApi.getDashboard();
        if (res.client) {
          setProfile(res.client);
        }
      } catch (err) {
        logger.error("[ProfileScreen] Failed to load profile:", err);
      }
    }
    load();
  }, []);

  const handleCheckUpdate = async () => {
    try {
      setCheckingUpdate(true);
      await checkAppUpdate(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to sign out of the client portal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account Identity Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "KB"}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || "Client Partner"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Client Account</Text>
        </View>
      </Card>

      {/* Corporate Metadata */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Company Details</Text>
      </View>

      <Card style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Company Name</Text>
          <Text style={styles.value}>{profile?.company_name || profile?.name || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>GSTIN</Text>
          <Text style={[styles.value, styles.mono]}>{profile?.gstin || "Unregistered (Non-GST)"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>PAN</Text>
          <Text style={[styles.value, styles.mono]}>{profile?.pan || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{profile?.phone || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Billing Address</Text>
          <Text style={[styles.value, { maxWidth: "60%", textAlign: "right" }]}>
            {profile?.billing_address || profile?.city || "—"}
          </Text>
        </View>
      </Card>

      {/* Account Support Card */}
      <Card style={styles.systemCard}>
        <View style={styles.systemRow}>
          <Ionicons name="headset-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.systemTitle}>Dedicated Account Support</Text>
            <Text style={styles.systemSub}>Account Manager Active • support@kabhyan.com</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
      </Card>

      {/* Over-The-Air (OTA) Updates & App Release Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>App & System Updates</Text>
      </View>

      <Card style={styles.updatesCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Installed Version</Text>
          <Text style={styles.value}>v{updateMeta.runtimeVersion}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Release Channel</Text>
          <Text style={[styles.value, styles.mono]}>{updateMeta.channel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>OTA Delivery Engine</Text>
          <View style={styles.otaStatusPill}>
            <View style={[styles.otaStatusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.otaStatusText}>
              {updateMeta.isEnabled ? "EAS Live Active" : "Metro / Expo Go"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkUpdateBtn}
          onPress={handleCheckUpdate}
          disabled={checkingUpdate}
          activeOpacity={0.8}
        >
          {checkingUpdate ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="cloud-download-outline" size={16} color={colors.primary} />
          )}
          <Text style={styles.checkUpdateBtnText}>
            {checkingUpdate ? "Checking Update Servers..." : "Check for Updates"}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Logout Action */}
      <Button
        title="Log Out"
        variant="danger"
        onPress={handleLogout}
        icon={<Ionicons name="log-out-outline" size={16} color={colors.textLight} />}
        style={styles.logoutBtn}
      />

      <Text style={styles.versionText}>Kabhyan Connect • Version 1.0.0 (Build {updateMeta.updateId})</Text>
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
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: fonts.bold,
    color: colors.textLight,
    fontSize: 22,
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  detailsCard: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  systemCard: {
    marginBottom: 16,
    backgroundColor: colors.card,
  },
  systemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  systemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  systemSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  updatesCard: {
    marginBottom: 20,
    backgroundColor: colors.card,
  },
  otaStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  otaStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  otaStatusText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  checkUpdateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  checkUpdateBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 14,
  },
  versionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
});
