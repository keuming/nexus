/**
 * SupportCSNModal — Interface de support NEXUS pour le chatbot
 * Permet à l'admin NEXUS de prendre le relais du chatbot IA et converser directement avec le client
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Headphones, Send, Loader, X, AlertCircle } from "lucide-react";

interface SupportCSNModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  visitorName: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "csn" | "assistant";
  content: string;
  createdAt: Date | string;
}

export default function SupportCSNModal({
  isOpen,
  onClose,
  sessionToken,
  visitorName,
}: SupportCSNModalProps) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Récupérer les messages de la session
  const { data: messages = [], refetch: refetchMessages } = trpc.chatbot.getSessionMessages.useQuery(
    { sessionId: parseInt(sessionToken) || 0 },
    {
      enabled: isOpen && !!sessionToken,
      refetchInterval: 2000, // Rafraîchir toutes les 2 secondes
    }
  );

  // Envoyer un message CSN
  const sendMessage = trpc.chatbot.replyAsCSN.useMutation({
    onSuccess: () => {
      setMessageText("");
      setSending(false);
      refetchMessages();
      toast.success("Message envoyé");
    },
    onError: (error) => {
      setSending(false);
      toast.error(error.message || "Erreur lors de l'envoi du message");
    },
  });

  // Mettre à jour les messages locaux
  useEffect(() => {
    if (messages) {
      setLocalMessages(messages as ChatMessage[]);
    }
  }, [messages]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    sendMessage.mutate({
      sessionId: parseInt(sessionToken),
      content: messageText.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-base">Support NEXUS — {visitorName}</DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Session: {sessionToken}
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
              Support actif
            </Badge>
          </div>
        </DialogHeader>

        {/* Zone de messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 rounded-lg"
        >
          {localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <AlertCircle className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Aucun message pour le moment</p>
            </div>
          ) : (
            localMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row" : "flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.role === "user"
                    ? "bg-gray-200 text-gray-600"
                    : msg.role === "csn"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-[#E8751A]/10 text-[#E8751A]"
                }`}>
                  {msg.role === "user" ? "👤" : msg.role === "csn" ? "🎧" : "🤖"}
                </div>

                {/* Message bubble */}
                <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                    : msg.role === "csn"
                    ? "bg-purple-500 text-white rounded-tr-sm"
                    : "bg-[#E8751A] text-white rounded-tr-sm"
                }`}>
                  {msg.role === "csn" && (
                    <p className="text-xs font-semibold text-purple-100 mb-1">Support NEXUS</p>
                  )}
                  {msg.role === "assistant" && (
                    <p className="text-xs font-semibold text-orange-100 mb-1">Assistant IA</p>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Zone de saisie */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Textarea
            placeholder="Tapez votre message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1 self-end"
          >
            {sending ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
