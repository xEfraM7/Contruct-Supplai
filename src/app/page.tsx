"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardOverview } from "@/components/dashboard-overview";
import { AIAgentsPanel } from "@/components/ai-agents-panel";
import { BlueprintWorkMenu } from "@/components/blueprint-work-menu";
import { SubcontractorsGrid } from "@/components/subcontractors-grid";
import { AnalyticsSection } from "@/components/analytics-section";

export default function Page() {
  const [activeSection, setActiveSection] = useState("Dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "Dashboard":
        return <DashboardOverview />;
      case "AI Agents":
        return <AIAgentsPanel />;
      case "Blueprints":
        return <BlueprintWorkMenu />;
      case "Subcontractors":
        return <SubcontractorsGrid />;
      case "Analytics":
        return <AnalyticsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <div className="p-8">{renderSection()}</div>
    </DashboardLayout>
  );
}
