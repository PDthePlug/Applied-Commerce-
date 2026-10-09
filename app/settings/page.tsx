import type { Metadata } from "next";
import { SettingsDashboard } from "@/components/settings-dashboard";
import "./settings.css";

export const metadata: Metadata = {
  title: "Settings",
  description: "Personalise your Applied Commerce profile, appearance and reading experience.",
};

export default function SettingsPage() {
  return <SettingsDashboard />;
}
