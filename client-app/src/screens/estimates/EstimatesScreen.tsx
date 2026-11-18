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
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { portalApi, Estimate } from "../../api/portal";

export const EstimatesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEstimates = useCallback(async () => {
    try {
      const res = await portalApi.getEstimates();
      const data = Array.isArray(res.estimates)
        ? res.estimates
        : (res.estimates as any)?.data || [];
      setEstimates(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load quotations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEstimates();
  };

  const renderEstimateCard = ({ item }: { item: Estimate }) => {
    const linkedProforma = item.proforma_invoices && item.proforma_invoices[0];
    const isConverted = item.status === "invoiced" || Boolean(linkedProforma);
    const isAccepted = item.status === "accepted";
    const isDeclined = item.status === "declined";

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("EstimateDetail", { estimateId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.estNumber}>{item.estimate_number}</Text>
              <Text style={styles.estDate}>Issued: {item.estimate_date}</Text>
            </View>
            <Badge
              label={isConverted ? "CONVERTED TO PROFORMA" : item.status}
              variant={isConverted ? "purple" : isAccepted ? "success" : isDeclined ? "danger" : "warning"}
            />
          </View>

          {isConverted && linkedProforma && (
            <View style={styles.proformaBanner}>
              <Ionicons name="arrow-forward-circle" size={14} color={colors.purple} />
              <Text style={styles.proformaBannerText}>
                Mobilized under Proforma #{linkedProforma.proforma_number}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.metaLabel}>Subtotal</Text>
              <Text style={styles.metaValue}>₹{Number(item.subtotal || 0).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.metaLabel}>Estimated Total</Text>
              <Text style={styles.grossTotal}>₹{Number(item.total).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.validityText}>
              {isConverted
                ? "Active in Proforma Pipeline"
                : item.expiry_date
                ? `Valid until: ${item.expiry_date}`
                : "Valid for 30 days"}
            </Text>
            <View style={styles.reviewLink}>
              <Text style={styles.reviewLinkText}>
                {isConverted ? "View Progression" : "Review Scope"}
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
          <Text style={styles.loadingText}>Fetching quotations & scope proposals...</Text>
        </View>
      ) : (
        <FlatList
          data={estimates}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEstimateCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No Estimates Found"
              description="You do not have any pending quotations or proposals at this time."
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
  },
  estNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  estDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  grossTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  validityText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  reviewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  proformaBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.purpleBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  proformaBannerText: {
    fontSize: 11,
    color: colors.purple,
    fontWeight: "700",
  },
});
