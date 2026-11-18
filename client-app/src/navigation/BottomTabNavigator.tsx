import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { InvoicesScreen } from "../screens/invoices/InvoicesScreen";
import { ProjectsScreen } from "../screens/projects/ProjectsScreen";
import { EstimatesScreen } from "../screens/estimates/EstimatesScreen";
import { TicketsScreen } from "../screens/tickets/TicketsScreen";
import { useAuth } from "../context/AuthContext";

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();

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
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
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
        name="InvoicesTab"
        component={InvoicesScreen}
        options={{
          title: "Invoices",
          tabBarLabel: "Invoices",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={size} color={color} />
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
        name="EstimatesTab"
        component={EstimatesScreen}
        options={{
          title: "Quotations",
          tabBarLabel: "Quotes",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} />
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
