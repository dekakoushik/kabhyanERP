import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Detect if running inside the Expo Go sandbox app.
 * Note: Starting in Expo SDK 53, remote push notifications (FCM/APNs) and
 * native channel managers are intentionally unavailable in the standard Expo Go client.
 * Full remote push notifications when the app is closed are supported in
 * Development Builds (`npx expo run:android`) and standalone Production APKs/AABs.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";

// Configure how notifications are presented when the app is in the foreground
try {
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
} catch (e) {
  // Safe ignore in restricted environments
}

/**
 * Configure Android notification channels and request user permission
 * to obtain the unique Expo push notification token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Remote push notifications and native channels cannot run in Expo Go (SDK 53+)
  if (isExpoGo) {
    console.log(
      "[PushNotifications] Info: Running inside Expo Go. Native OS push notifications require a development build (`npx expo run:android`) or standalone APK."
    );
    return null;
  }

  // Push notifications only deliver to physical devices
  if (!Device.isDevice) {
    console.log("[PushNotifications] Notice: Push notifications require a physical device.");
    return null;
  }

  let token: string | null = null;

  // Android 8.0+ requires notification channels
  if (Platform.OS === "android") {
    try {
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
    } catch (channelError) {
      console.warn("[PushNotifications] Notification channel creation skipped:", channelError);
    }
  }

  // Request or check existing permission (Android 13+ and iOS)
  try {
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

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const pushTokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = pushTokenResponse.data;
  } catch (error) {
    console.warn("[PushNotifications] Failed to obtain push token:", error);
  }

  return token;
}

export { Notifications };
