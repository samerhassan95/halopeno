"use client";

import * as React from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/storefront/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";

export function LiveChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [sessionId] = React.useState(() => `chat-${Date.now()}`);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [thread, setThread] = React.useState<Array<{ from: string; message: string }>>([]);
  const [sending, setSending] = React.useState(false);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await api.post<{ ok: boolean; reply?: string }>("/storefront/chat", {
        name,
        email,
        message,
        sessionId,
      });
      setThread((prev) => [
        ...prev,
        { from: "you", message },
        ...(res.reply ? [{ from: "support", message: res.reply }] : []),
      ]);
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:bottom-6"
        aria-label="Open live chat"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
      {open ? (
        <div className="fixed bottom-40 right-4 z-50 flex w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-[24px] bg-card shadow-soft-lg md:bottom-24">
          <div className="bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Live chat</div>
          <div className="max-h-64 space-y-2 overflow-y-auto p-3 text-sm">
            {thread.length === 0 ? (
              <p className="text-muted-foreground">Ask anything — messages go to the admin support inbox.</p>
            ) : (
              thread.map((row, i) => (
                <div key={i} className={row.from === "you" ? "text-right" : "text-left"}>
                  <span className="inline-block rounded-2xl bg-secondary px-3 py-2">{row.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="space-y-2 border-t p-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 rounded-xl" />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 rounded-xl" />
            <div className="flex gap-2">
              <Input
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-9 rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && void send()}
              />
              <Button size="icon" onClick={() => void send()} disabled={sending}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
