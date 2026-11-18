import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { ProjectsScreen } from "../screens/projects/ProjectsScreen";
import { TicketsScreen } from "../screens/tickets/TicketsScreen";
import { BillingScreen } from "../screens/billing/BillingScreen";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Adaptive bottom clearance:
  // - Gesture navigation / Home Indicator (insets.bottom > 0): clearance matching device insets (20-34px)
  // - 3-button software navigation / hardware buttons (insets.bottom === 0): standard 8px clearance
  const bottomBarPadding = insets.bottom > 0 ? insets.bottom : 8;
  const bottomBarHeight = 56 + bottomBarPadding;

  const renderHeaderRight = () => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate("Profile")}
      style={styles.avatarButton}
      aria-label="Account Profile"
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.name ? user.name.slice(0, 2).toUpperCase() : "KB"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeaderLogo = () => (
    <Image
      source={require("../../assets/logo.png")}
      style={styles.headerLogo}
      resizeMode="contain"
      accessible={true}
      accessibilityLabel="Kabhyan Technologies"
    />
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: "800",
          color: colors.text,
        },
        headerRight: renderHeaderRight,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: bottomBarHeight,
          paddingBottom: bottomBarPadding,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          headerTitle: renderHeaderLogo,
          headerTitleAlign: "left",
          tabBarLabel: "Overview",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{
          title: "Projects",
          tabBarLabel: "Projects",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="TicketsTab"
        component={TicketsScreen}
        options={{
          title: "Support Desk",
          tabBarLabel: "Support",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "help-buoy" : "help-buoy-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="BillingTab"
        component={BillingScreen}
        options={{
          title: "Billing & Documents",
          tabBarLabel: "Billing",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  headerLogo: {
    width: 140,
    height: 38,
    marginLeft: 4,
  },
  avatarButton: {
    marginRight: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: "800",
  },
});
