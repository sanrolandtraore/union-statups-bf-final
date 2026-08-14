import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Message = { role: "user" | "assistant"; content: string };

const AIAssistant = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = [
    { label: t("miscV2.aiAssistant.actionPitch"), prompt: t("miscV2.aiAssistant.actionPitchPrompt") },
    { label: t("miscV2.aiAssistant.actionMarket"), prompt: t("miscV2.aiAssistant.actionMarketPrompt") },
    { label: t("miscV2.aiAssistant.actionFunding"), prompt: t("miscV2.aiAssistant.actionFundingPrompt") },
    { label: t("miscV2.aiAssistant.actionJobDesc"), prompt: t("miscV2.aiAssistant.actionJobDescPrompt") },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-startup-assistant", {
        body: { messages: updatedMessages },
      });

      if (error) throw error;

      if (data?.error) {
        setMessages(prev => [...prev, { role: "assistant", content: t("miscV2.aiAssistant.errorPrefix", { error: data.error }) }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      console.error("AI assistant error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: t("miscV2.aiAssistant.errorGeneric") }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-3 shadow-lg transition-transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t("miscV2.aiAssistant.openLabel")}
      >
        <span className="text-sm font-semibold tracking-tight text-primary-foreground">{t("miscV2.aiAssistant.btnLabel")}</span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-2 left-2 z-50 flex h-[70vh] max-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:left-auto sm:right-6 sm:w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-gold px-4 py-3">
              <span className="font-display font-semibold tracking-tight text-primary-foreground">
                {t("miscV2.aiAssistant.headerTitle")}
              </span>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("miscV2.aiAssistant.greeting")}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
                      >
                        <span aria-hidden="true" className="h-px w-3 shrink-0 bg-primary/70" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="mb-3 flex justify-start">
                  <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("miscV2.aiAssistant.thinking")}
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-3">
              {!user && (
                <p className="mb-2 text-center text-xs text-muted-foreground">
                  {t("miscV2.aiAssistant.loginRequired")}
                </p>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("miscV2.aiAssistant.placeholder")}
                  className="min-h-[40px] max-h-[100px] resize-none text-sm"
                  rows={1}
                  disabled={loading}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="h-10 w-10 shrink-0"
                  aria-label={t("miscV2.aiAssistant.send")}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
