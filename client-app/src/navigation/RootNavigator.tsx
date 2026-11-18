import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { InvoiceDetailScreen } from "../screens/invoices/InvoiceDetailScreen";
import { ProjectDetailScreen } from "../screens/projects/ProjectDetailScreen";
import { EstimateDetailScreen } from "../screens/estimates/EstimateDetailScreen";
import { TicketDetailScreen } from "../screens/tickets/TicketDetailScreen";
import { CreateTicketScreen } from "../screens/tickets/CreateTicketScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "800",
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
