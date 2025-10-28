"use client";

import { useState, useEffect } from "react";
import type { UserSettings } from "@/types/settings";

export function useSettingsLogic() {
  const [settings, setSettings] = useState<UserSettings>({
    companyName: "",
    licenseNumber: "",
    phoneNumber: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();

        setSettings({
          companyName: data.settings?.company_name || data.user?.user_metadata?.name || "",
          licenseNumber: data.settings?.license_number || "",
          phoneNumber: data.settings?.phone_number || "",
          email: data.settings?.email || data.user?.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: settings.companyName,
          license_number: settings.licenseNumber,
          phone_number: settings.phoneNumber,
          email: settings.email,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return {
    settings,
    isLoading,
    isSaving,
    message,
    handleSave,
    handleChange,
  };
}
