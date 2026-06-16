import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  RefreshCw,
  Headphones,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Message = {
  id: number;
  companyId: number;
  senderType: "company" | "csn";
  senderId: number | null;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

export default function CompanyInbox() {
  const utils = trpc.useUtils();
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch } = trpc.team.listMessagesForCompany.useQuery(
    undefined,
    { refetchInterval: 15000 } // Rafraîchissement auto toutes les 15s
  );

  const { data: unreadCount = 0 } = trpc.team.unreadCountForCompany.useQuery(
    undefined,
    { refetchInterval: 15000 }
  );

  const sendMessage = trpc.team.sendMessageAsCompany.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.team.listMessagesForCompany.invalidate();
      utils.team.unreadCountForCompany.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.team.markReadAsCompany.useMutation({
    onSuccess: () => {
      utils.team.unreadCountForCompany.invalidate();
      utils.team.listMessagesForCompany.invalidate();
    },
  });

  // Marquer comme lu à l'ouverture
  useEffect(() => {
    if (unreadCount > 0) {
      markRead.mutate();
    }
  }, [unreadCount]);

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const content = newMessage.trim();
    if (!content) return;
    sendMessage.mutate({ content });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#E8751A]/10 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8751A] flex items-center justify-center">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Support HUB_RESA HUB_RESA</h3>
            <p className="text-xs text-gray-500">Messagerie directe avec l'équipe HUB_RESA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs">
              {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Chargement...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Aucun message pour l'instant</p>
            <p className="text-sm text-gray-400 mt-1">
              Envoyez un message à l'équipe HUB_RESA pour toute question ou demande de support.
            </p>
          </div>
        ) : (
          (messages as Message[]).map((msg) => {
            const isFromCsn = msg.senderType === "csn";
            return (
              <div
                key={msg.id}
                className={`flex ${isFromCsn ? "justify-start" : "justify-end"}`}
              >
                <div className={`max-w-[75%] ${isFromCsn ? "order-2" : ""}`}>
                  {isFromCsn && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#E8751A] flex items-center justify-center">
                        <Headphones className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-[#E8751A]">{msg.senderName}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isFromCsn
                        ? "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                        : "bg-[#E8751A] text-white rounded-tr-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${isFromCsn ? "text-left" : "text-right"}`}>
                    {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message... (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
            className="resize-none min-h-[60px] max-h-[120px] text-sm"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="bg-[#E8751A] hover:bg-[#C96020] text-white self-end h-[60px] px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Temps de réponse habituel : quelques heures en jours ouvrables
        </p>
      </div>
    </div>
  );
}
