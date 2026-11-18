import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { portalApi, ClientProfile } from "../../api/portal";
import { useAuth } from "../../context/AuthContext";

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await portalApi.getDashboard();
        if (res.client) {
          setProfile(res.client);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    load();
  }, []);

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
          <Text style={styles.roleText}>Verified Client Account</Text>
        </View>
      </Card>

      {/* Corporate Metadata */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Corporate Coordinates</Text>
      </View>

      <Card style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Company Entity</Text>
          <Text style={styles.value}>{profile?.company_name || profile?.name || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>GSTIN</Text>
          <Text style={[styles.value, styles.mono]}>{profile?.gstin || "Unregistered (Non-GST)"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Income Tax PAN</Text>
          <Text style={[styles.value, styles.mono]}>{profile?.pan || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Registered Phone</Text>
          <Text style={styles.value}>{profile?.phone || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Billing Address</Text>
          <Text style={[styles.value, { maxWidth: "60%", textAlign: "right" }]}>
            {profile?.billing_address || profile?.city || "Registered Corporate Office"}
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

      {/* Logout Action */}
      <Button
        title="Log Out"
        variant="danger"
        onPress={handleLogout}
        icon={<Ionicons name="log-out-outline" size={16} color={colors.textLight} />}
        style={styles.logoutBtn}
      />

      <Text style={styles.versionText}>Kabhyan Client • Version 1.0.0</Text>
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
    color: colors.textLight,
    fontSize: 22,
    fontWeight: "900",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  userEmail: {
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
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
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
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
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
    marginBottom: 20,
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
