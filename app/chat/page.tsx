import { Metadata } from "next";
import { ConversationProvider } from "./context/ConversationContext";
import ChatContainer from "./components/ChatContainer";

export const metadata: Metadata = {
  title: "Chat - DuoLog.ai",
  description: "AI collaboration workspace where Claude and GPT-4 work together to refine your prompts",
};

export default function ChatPage() {
  return (
    <ConversationProvider>
      <ChatContainer />
    </ConversationProvider>
  );
}