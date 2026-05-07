import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ChatInterface />
    </Suspense>
  );
}
