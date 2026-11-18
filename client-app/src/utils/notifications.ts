import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Configure Android notification channels and request user permission
 * to obtain the unique Expo push notification token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Android 8.0+ requires notification channels
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("commercial_notifications", {
      name: "Commercial & Support Notifications",
      description: "Direct notifications for quotations, invoices, milestone updates, and support ticket replies.",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  // Push notifications only deliver to physical devices
  if (!Device.isDevice) {
    console.log("[PushNotifications] Notice: Push notifications require a physical device.");
    return null;
  }

  // Request or check existing permission (Android 13+ and iOS)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[PushNotifications] Permission not granted by user.");
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const pushTokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = pushTokenResponse.data;
  } catch (error) {
    console.error("[PushNotifications] Failed to obtain Expo push token:", error);
  }

  return token;
}

export { Notifications };
