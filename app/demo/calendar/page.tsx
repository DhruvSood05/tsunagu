import { Suspense } from "react";
import { DemoProvider } from "@/lib/demo/DemoContext";
import DemoCalendarView from "../DemoCalendarView";

export const metadata = {
  title: "Calendar — Demo — Tsunagu",
  description: "Try the Tsunagu calendar with sample events.",
};

export default function DemoCalendarPage() {
  return (
    <DemoProvider>
      <Suspense>
        <DemoCalendarView />
      </Suspense>
    </DemoProvider>
  );
}
