import { Suspense } from "react";
import { DemoProvider } from "@/lib/demo/DemoContext";
import DemoDashboard from "./DemoDashboard";

export const metadata = {
  title: "Demo — Tsunagu",
  description: "Try the Tsunagu demo workspace with sample emails and calendar events.",
};

export default function DemoPage() {
  return (
    <DemoProvider>
      <Suspense>
        <DemoDashboard />
      </Suspense>
    </DemoProvider>
  );
}
