import { useState, useRef, useEffect } from "react";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useGetGeminiConversation,
  useDeleteGeminiConversation,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Send, Trash2, Loader2, BrainCircuit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function Mentor() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: convsLoading } = useListGeminiConversations();
  const { data: activeConv, isLoading: convLoading } = useGetGeminiConversation(
    selectedId ?? 0,
    { query: { enabled: !!selectedId } }
  );
  const { mutate: createConv } = useCreateGeminiConversation();
  const { mutate: deleteConv } = useDeleteGeminiConversation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, streamingContent]);

  function handleNew() {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    createConv(
      { data: { title } },
      {
        onSuccess: (conv) => {
          queryClient.invalidateQueries({ queryKey: ["/api/gemini/conversations"] });
          setSelectedId(conv.id);
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteConv(
      { id: String(id) },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/gemini/conversations"] });
          if (selectedId === id) setSelectedId(null);
        },
      }
    );
  }

  async function handleSend() {
    if (!input.trim() || !selectedId || isSending) return;
    const message = input.trim();
    setInput("");
    setIsSending(true);
    setStreamingContent("");

    try {
      const res = await fetch(`${BASE_URL}/api/gemini/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
        credentials: "include",
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (part.startsWith("data: ")) {
            try {
              const data = JSON.parse(part.slice(6));
              if (data.content) setStreamingContent((prev) => prev + data.content);
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: [`/api/gemini/conversations/${selectedId}`] });
                setStreamingContent("");
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }

  const messages = activeConv?.messages ?? [];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <Button onClick={handleNew} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {convsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : conversations?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
            ) : (
              conversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedId === conv.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground"}`}
                  onClick={() => setSelectedId(conv.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{conv.title}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">WelloAI Mentor</h2>
            <p className="text-muted-foreground max-w-md mb-6">Your AI-powered financial mentor specialized in African and global markets. Ask anything about investing, trading strategies, or market analysis.</p>
            <Button onClick={handleNew}><Plus className="w-4 h-4 mr-2" /> Start a conversation</Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <Card className="flex-1 bg-card border-border overflow-hidden">
              <ScrollArea className="h-full p-6">
                {convLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-3/4" />)}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.length === 0 && !streamingContent && (
                      <p className="text-center text-muted-foreground py-8">Send a message to start the conversation.</p>
                    )}
                    {messages.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {streamingContent && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground">
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown>{streamingContent}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                    {isSending && !streamingContent && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-3 bg-muted">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Input */}
            <div className="flex gap-2 mt-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about stocks, trading strategies, African markets..."
                className="flex-1 bg-card border-border"
                disabled={isSending}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isSending}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
