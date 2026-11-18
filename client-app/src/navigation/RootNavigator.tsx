import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { logger } from "../utils/logger";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { InvoiceDetailScreen } from "../screens/billing/InvoiceDetailScreen";
import { ProjectDetailScreen } from "../screens/projects/ProjectDetailScreen";
import { EstimateDetailScreen } from "../screens/billing/EstimateDetailScreen";
import { TicketDetailScreen } from "../screens/tickets/TicketDetailScreen";
import { CreateTicketScreen } from "../screens/tickets/CreateTicketScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";

export const navigationRef = createNavigationContainerRef<any>();

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { token, loading } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Navigate when a push notification is tapped
  const handleNotificationNavigation = (response: Notifications.NotificationResponse) => {
    try {
      const data = response?.notification?.request?.content?.data;
      if (!data || !navigationRef.isReady()) return;

      if (data.screen === "EstimateDetail" && data.estimateId) {
        navigationRef.navigate("EstimateDetail", { estimateId: data.estimateId });
      } else if (data.screen === "InvoiceDetail" && data.invoiceId) {
        navigationRef.navigate("InvoiceDetail", {
          invoiceId: data.invoiceId,
          type: data.type,
        });
      } else if (data.screen === "TicketDetail" && data.ticketId) {
        navigationRef.navigate("TicketDetail", { ticketId: data.ticketId });
      } else if (data.screen === "ProjectDetail" && data.projectId) {
        navigationRef.navigate("ProjectDetail", { projectId: data.projectId });
      }
    } catch (err) {
      logger.warn("[Navigation] Failed to navigate from notification:", err);
    }
  };

  useEffect(() => {
    if (!token) return;

    try {
      // Handle case where app was launched from cold-start by clicking a notification
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) {
            handleNotificationNavigation(response);
          }
        })
        .catch(() => {});

      // Handle notification tap while app is backgrounded or active
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(response);
      });
    } catch (e) {
      // Safe fallback in environments like Expo Go where listeners may be restricted
    }

    return () => {
      try {
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (e) {}
    };
  }, [token]);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTitleStyle: {
            fontFamily: fonts.bold,
            fontSize: 16,
            color: colors.text,
          },
          headerTintColor: colors.primary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {!token ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={BottomTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InvoiceDetail"
              component={InvoiceDetailScreen}
              options={({ route }: any) => ({
                title: route?.params?.type === "proforma" ? "Proforma Invoice" : "Invoice Details",
              })}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{ title: "Project Details" }}
            />
            <Stack.Screen
              name="EstimateDetail"
              component={EstimateDetailScreen}
              options={{ title: "Quotation Details" }}
            />
            <Stack.Screen
              name="TicketDetail"
              component={TicketDetailScreen}
              options={{ title: "Support Ticket" }}
            />
            <Stack.Screen
              name="CreateTicket"
              component={CreateTicketScreen}
              options={{ title: "New Ticket" }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: "Account Profile" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
