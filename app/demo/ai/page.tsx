import { Suspense } from "react";
import { DemoProvider } from "@/lib/demo/DemoContext";
import DemoAIContent from "./DemoAIContent";

export const metadata = { title: "AI Assistant — Tsunagu Demo" };

export default function DemoAIPage() {
  return (
    <DemoProvider>
      <Suspense>
        <DemoAIContent />
      </Suspense>
    </DemoProvider>
  );
}
