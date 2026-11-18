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
import { Button } from "../../components/Button";
import { portalApi, Estimate } from "../../api/portal";

export const EstimateDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { estimateId } = route.params;
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await portalApi.getEstimate(estimateId);
      setEstimate(res.estimate);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load quotation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [estimateId]);

  const handleRespond = (action: "accepted" | "declined") => {
    const title = action === "accepted" ? "Accept Scope & Quotation?" : "Decline Quotation?";
    const msg =
      action === "accepted"
        ? "By accepting, you confirm approval of the deliverables and pricing."
        : "Are you sure you want to decline this proposal?";

    Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel" },
      {
        text: action === "accepted" ? "Approve Quote" : "Decline",
        style: action === "accepted" ? "default" : "destructive",
        onPress: async () => {
          try {
            setActing(true);
            const res = await portalApi.respondEstimate(estimateId, action);
            Alert.alert("Success", res.message || `Quotation ${action} successfully.`);
            fetchDetail();
          } catch (err: any) {
            Alert.alert("Action Failed", err.message || "Could not record response.");
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  if (loading || !estimate) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading quotation details...</Text>
      </View>
    );
  }

  const isPending = estimate.status === "sent" || estimate.status === "draft";
  const items = estimate.items || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.estNumber}>{estimate.estimate_number}</Text>
            <Text style={styles.dateText}>Issued on: {estimate.estimate_date}</Text>
            {estimate.expiry_date && (
              <Text style={styles.dateText}>Validity: {estimate.expiry_date}</Text>
            )}
          </View>
          <Badge
            label={estimate.status}
            variant={
              estimate.status === "accepted"
                ? "success"
                : estimate.status === "declined"
                ? "danger"
                : "warning"
            }
          />
        </View>

        {isPending && (
          <View style={styles.actionButtonsRow}>
            <Button
              title="Decline"
              variant="outline"
              onPress={() => handleRespond("declined")}
              disabled={acting}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Accept & Approve"
              variant="success"
              onPress={() => handleRespond("accepted")}
              loading={acting}
              icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.textLight} />}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scope Deliverables & Schedule</Text>
      </View>

      {items.length === 0 ? (
        <Card>
          <Text style={styles.noItemsText}>Comprehensive scope deliverables included</Text>
        </Card>
      ) : (
        items.map((item, idx) => (
          <Card key={item.id || idx} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.description}</Text>
            
            <View style={styles.itemMetaRow}>
              <Text style={styles.itemQty}>
                Qty: {item.quantity} {item.unit || "units"} @ ₹{Number(item.unit_price).toLocaleString()}
              </Text>
              <View style={styles.gstBadge}>
                <Text style={styles.gstBadgeText}>+{item.gst_rate || 18}% GST</Text>
              </View>
            </View>

            <View style={styles.itemDivider} />

            <View style={styles.itemFooterRow}>
              <Text style={styles.itemTaxable}>
                Taxable: ₹{Number(item.taxable_amount || (item.quantity * item.unit_price)).toLocaleString()}
              </Text>
              <Text style={styles.itemTotal}>
                Gross: ₹{Number(item.total_amount || 0).toLocaleString()}
              </Text>
            </View>
          </Card>
        ))
      )}

      {/* Summary */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Financial Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taxable Subtotal</Text>
          <Text style={styles.summaryValue}>₹{Number(estimate.subtotal).toLocaleString()}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST Component</Text>
          <Text style={styles.summaryValue}>+₹{Number(estimate.tax_amount).toLocaleString()}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.grossLabel}>Estimated Gross (INR)</Text>
          <Text style={styles.grossValue}>₹{Number(estimate.total).toLocaleString()}</Text>
        </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  estNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
  itemCard: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  itemMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQty: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gstBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gstBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  itemFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTaxable: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  noItemsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  breakdownCard: {
    marginTop: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  grossLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  grossValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
});
