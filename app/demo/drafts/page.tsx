import { Suspense } from "react";
import { DemoProvider } from "@/lib/demo/DemoContext";
import DemoDraftsContent from "./DemoDraftsContent";

export const metadata = { title: "Drafts — Tsunagu Demo" };

export default function DemoDraftsPage() {
  return (
    <DemoProvider>
      <Suspense>
        <DemoDraftsContent />
      </Suspense>
    </DemoProvider>
  );
}
