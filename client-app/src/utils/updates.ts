import * as Updates from "expo-updates";
import { Alert } from "react-native";
import { logger } from "./logger";

export interface SystemUpdateMeta {
  isEnabled: boolean;
  channel: string;
  updateId: string;
  runtimeVersion: string;
  isEmbeddedLaunch: boolean;
}

/**
 * Get current OTA update metadata for system diagnostics.
 */
export function getUpdateMetadata(): SystemUpdateMeta {
  return {
    isEnabled: Updates.isEnabled,
    channel: Updates.channel || "production",
    updateId: Updates.updateId ? Updates.updateId.slice(0, 8) : "embedded",
    runtimeVersion: typeof Updates.runtimeVersion === "string" ? Updates.runtimeVersion : "1.0.0",
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}

/**
 * Check for Over-The-Air (OTA) updates.
 * In development / Expo Go, OTA updates are disabled by the Expo SDK runtime.
 */
export async function checkAppUpdate(interactive: boolean = false): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) {
    if (interactive) {
      Alert.alert(
        "Development / Expo Go Mode",
        "Over-The-Air (OTA) updates are active in standalone production builds (EAS). In Expo Go, JavaScript changes reload automatically via Metro."
      );
    }
    return false;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      if (interactive) {
        Alert.alert(
          "Update Available",
          "A new update for Kabhyan Connect is available. Would you like to download it now?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Download",
              onPress: () => downloadAndApplyUpdate(true),
            },
          ]
        );
      } else {
        // Auto-download in background if non-interactive
        await downloadAndApplyUpdate(false);
      }
      return true;
    } else {
      if (interactive) {
        Alert.alert("Up to Date", "You are using the latest version of Kabhyan Connect.");
      }
      return false;
    }
  } catch (err: any) {
    logger.warn("[OTA Updates] Error checking for updates:", err);
    if (interactive) {
      Alert.alert("Update Check Failed", err.message || "Could not reach update servers. Please check your internet connection.");
    }
    return false;
  }
}

/**
 * Download and apply the update, prompting user to restart the app.
 */
export async function downloadAndApplyUpdate(interactive: boolean = false): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;

  try {
    const fetched = await Updates.fetchUpdateAsync();
    if (fetched.isNew) {
      Alert.alert(
        "Update Ready",
        "The latest update has been downloaded. Restart the app now to apply changes?",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Restart Now",
            onPress: async () => {
              await Updates.reloadAsync();
            },
          },
        ]
      );
    }
  } catch (err: any) {
    logger.error("[OTA Updates] Error fetching update:", err);
    if (interactive) {
      Alert.alert("Download Failed", "Failed to download update bundle. Please try again later.");
    }
  }
}
