import { Suspense } from "react";
import { DemoProvider } from "@/lib/demo/DemoContext";
import DemoSettingsContent from "./DemoSettingsContent";

export const metadata = { title: "Settings — Tsunagu Demo" };

export default function DemoSettingsPage() {
  return (
    <DemoProvider>
      <Suspense>
        <DemoSettingsContent />
      </Suspense>
    </DemoProvider>
  );
}
