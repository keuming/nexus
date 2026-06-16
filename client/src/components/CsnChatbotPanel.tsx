/**
 * CsnChatbotPanel — Interface de gestion du chatbot côté CSN
 * Permet aux agents CSN de :
 *  - Voir les sessions actives
 *  - Prendre le relais de l'IA (suspendre l'IA, répondre directement)
 *  - Intervenir en tant qu'admin (envoyer des messages directs)
 *  - Escalader vers un agent humain
 *  - Rendre la main à l'IA
 *  - Fermer une session
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  User,
  Headphones,
  Send,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
  UserCheck,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant" | "csn";
  content: string;
  createdAt: Date | string;
}

interface Session {
  id: number;
  sessionToken: string;
  visitorName: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  unreadCount: number;
  csnTookOver: boolean;
  humanTakeoverActive: boolean;
  humanTakeoverAt?: Date | string | null;
  adminInterventionActive?: boolean;
  adminId?: number | null;
  adminInterventionAt?: Date | string | null;
  adminInterventionReason?: string | null;
}

export default function CsnChatbotPanel() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [escaladeReason, setEscaladeReason] = useState("");
  const [showEscaladeDialog, setShowEscaladeDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: sessions = [], refetch: refetchSessions } = trpc.chatbot.listSessions.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );

  const { data: messages = [], refetch: refetchMessages } = trpc.chatbot.getSessionMessages.useQuery(
    { sessionId: selectedSession?.id ?? 0 },
    { enabled: !!selectedSession, refetchInterval: 4000 }
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync selectedSession with latest data from sessions list
  useEffect(() => {
    if (selectedSession) {
      const updated = (sessions as unknown as Session[]).find((s) => s.id === selectedSession.id);
      if (updated) setSelectedSession(updated);
    }
  }, [sessions]);

  const replyMutation = trpc.chatbot.replyAsCSN.useMutation({
    onSuccess: () => {
      setReplyText("");
      setSending(false);
      refetchMessages();
      refetchSessions();
      utils.chatbot.listSessions.invalidate();
    },
    onError: () => {
      setSending(false);
      toast.error("Erreur lors de l'envoi de la réponse");
    },
  });

  const sendAdminMutation = trpc.chatbot.sendAdminMessage.useMutation({
    onSuccess: () => {
      setReplyText("");
      setSending(false);
      refetchMessages();
      refetchSessions();
      toast.success("Intervention admin activée", {
        description: "Votre message a été envoyé au client. L'IA est suspendue.",
        duration: 3000,
      });
    },
    onError: () => {
      setSending(false);
      toast.error("Erreur lors de l'envoi du message admin");
    },
  });

  const escalateMutation = trpc.chatbot.escalateToHuman.useMutation({
    onSuccess: () => {
      setShowEscaladeDialog(false);
      setEscaladeReason("");
      refetchMessages();
      refetchSessions();
      toast.success("Session escaladée", {
        description: "L'IA est suspendue. Vous pouvez maintenant répondre directement.",
        duration: 4000,
      });
    },
    onError: () => {
      toast.error("Erreur lors de l'escalade");
    },
  });

  const takeoverMutation = trpc.chatbot.takeoverSession.useMutation({
    onSuccess: () => {
      refetchSessions();
      refetchMessages();
      toast.success("Mode agent humain activé", {
        description: "Vous avez pris le relais. L'IA est suspendue.",
        duration: 4000,
      });
    },
    onError: () => toast.error("Erreur lors de la prise de relais"),
  });

  const releaseMutation = trpc.chatbot.releaseSession.useMutation({
    onSuccess: () => {
      refetchSessions();
      refetchMessages();
      toast.success("L'IA a repris la conversation.");
    },
    onError: () => toast.error("Erreur lors du retour à l'IA"),
  });

  const closeSession = trpc.chatbot.markClosed.useMutation({
    onSuccess: () => {
      setSelectedSession(null);
      refetchSessions();
      toast.success("Session fermée");
    },
  });

  const handleReply = () => {
    if (!replyText.trim() || !selectedSession || sending) return;
    setSending(true);
    replyMutation.mutate({ sessionId: selectedSession.id, content: replyText.trim() });
  };

  const handleAdminMessage = () => {
    if (!replyText.trim() || !selectedSession || sending) return;
    setSending(true);
    sendAdminMutation.mutate({
      sessionId: selectedSession.id,
      content: replyText.trim(),
      reason: "Intervention directe",
    });
  };

  const handleEscalade = () => {
    if (!escaladeReason.trim() || !selectedSession) return;
    escalateMutation.mutate({
      sessionId: selectedSession.id,
      reason: escaladeReason.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const typedSessions = sessions as unknown as Session[];
  const typedMessages = messages as unknown as Message[];

  const openSessions = typedSessions.filter((s) => s.status !== "closed");
  const closedSessions = typedSessions.filter((s) => s.status === "closed");

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] gap-4">
      {/* ── Colonne gauche : liste des sessions ── */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#E8751A]" />
            <span className="text-sm font-semibold text-gray-700">Sessions actives</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={() => refetchSessions()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {typedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Aucune session</p>
            </div>
          ) : (
            <>
              {openSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedSession?.id === session.id ? "bg-orange-50 border-l-2 border-l-[#E8751A]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      session.adminInterventionActive
                        ? "bg-purple-100 text-purple-600"
                        : session.humanTakeoverActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-[#E8751A]/10 text-[#E8751A]"
                    }`}>
                      {session.visitorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-800 truncate">{session.visitorName}</p>
                        {session.adminInterventionActive && (
                          <Headphones className="h-3 w-3 text-purple-500 flex-shrink-0" />
                        )}
                        {session.humanTakeoverActive && (
                          <UserCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {session.adminInterventionActive ? (
                          <span className="text-xs text-purple-500 font-medium">Admin intervient</span>
                        ) : session.humanTakeoverActive ? (
                          <span className="text-xs text-blue-500 font-medium">Agent humain</span>
                        ) : (
                          <span className="text-xs text-green-500">IA active</span>
                        )}
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(session.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    {session.unreadCount > 0 && (
                      <span className="bg-[#E8751A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-bold">
                        {session.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {closedSessions.length > 0 && (
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Fermées ({closedSessions.length})</p>
                </div>
              )}
              {closedSessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors opacity-60 ${
                    selectedSession?.id === session.id ? "bg-gray-100 opacity-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {session.visitorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-600 truncate">{session.visitorName}</p>
                      <p className="text-xs text-gray-400">Fermé · {new Date(session.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Colonne droite : conversation ── */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {!selectedSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Sélectionnez une session</p>
            <p className="text-xs mt-1">Cliquez sur une conversation à gauche</p>
          </div>
        ) : (
          <>
            {/* En-tête de la session */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedSession.adminInterventionActive
                    ? "bg-purple-100 text-purple-600"
                    : selectedSession.humanTakeoverActive
                    ? "bg-blue-100 text-blue-600"
                    : "bg-[#E8751A]/10 text-[#E8751A]"
                }`}>
                  {selectedSession.visitorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedSession.visitorName}</p>
                  <p className="text-xs text-gray-400">
                    Session ouverte le {new Date(selectedSession.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Badge mode actuel */}
                {selectedSession.status === "open" && (
                  selectedSession.adminInterventionActive ? (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1.5" variant="outline">
                      <Headphones className="h-3 w-3" />
                      Admin intervient
                    </Badge>
                  ) : selectedSession.humanTakeoverActive ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5" variant="outline">
                      <UserCheck className="h-3 w-3" />
                      Agent humain actif
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5" variant="outline">
                      <Bot className="h-3 w-3" />
                      IA active
                    </Badge>
                  )
                )}

                {selectedSession.status !== "open" && (
                  <Badge className="bg-gray-100 text-gray-600" variant="outline">
                    Fermé
                  </Badge>
                )}

                {/* Bouton Escalader */}
                {selectedSession.status === "open" && !selectedSession.humanTakeoverActive && !selectedSession.adminInterventionActive && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={() => setShowEscaladeDialog(true)}
                  >
                    <Headphones className="h-3.5 w-3.5" />
                    Escalader
                  </Button>
                )}

                {/* Bouton Intervenir en tant qu'admin */}
                {selectedSession.status === "open" && !selectedSession.adminInterventionActive && !selectedSession.humanTakeoverActive && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={() => {
                      if (selectedSession) {
                        selectedSession.adminInterventionActive = true;
                      }
                    }}
                  >
                    <Headphones className="h-3.5 w-3.5" />
                    Intervenir en tant qu'admin
                  </Button>
                )}

                {/* Bouton Rendre à l'IA quand admin intervient */}
                {selectedSession.status === "open" && selectedSession.adminInterventionActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => releaseMutation.mutate({ sessionId: selectedSession.id })}
                    disabled={releaseMutation.isPending}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Rendre à l'IA
                  </Button>
                )}

                {/* Bouton Prendre le relais (agent humain) */}
                {selectedSession.status === "open" && !selectedSession.adminInterventionActive && !selectedSession.humanTakeoverActive && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => takeoverMutation.mutate({ sessionId: selectedSession.id })}
                    disabled={takeoverMutation.isPending}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Prendre le relais (Agent)
                  </Button>
                )}

                {/* Bouton Rendre à l'IA quand agent humain */}
                {selectedSession.status === "open" && selectedSession.humanTakeoverActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => releaseMutation.mutate({ sessionId: selectedSession.id })}
                    disabled={releaseMutation.isPending}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Rendre à l'IA
                  </Button>
                )}

                {/* Bouton Clore */}
                {selectedSession.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 text-gray-500 hover:text-red-500"
                    onClick={() => closeSession.mutate({ sessionId: selectedSession.id })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Clore
                  </Button>
                )}
              </div>
            </div>

            {/* Bandeau informatif si admin intervient */}
            {selectedSession.adminInterventionActive && selectedSession.status === "open" && (
              <div className="mx-4 mt-3 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-2 flex-shrink-0">
                <Headphones className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <p className="text-xs text-purple-700">
                  <strong>Admin intervient</strong> — {selectedSession.adminInterventionReason ? `Motif : ${selectedSession.adminInterventionReason}` : "Intervention en cours"}
                  {selectedSession.adminInterventionAt && (
                    <span className="text-purple-500 ml-1">
                      (depuis {new Date(selectedSession.adminInterventionAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Bandeau informatif si agent humain actif */}
            {selectedSession.humanTakeoverActive && selectedSession.status === "open" && (
              <div className="mx-4 mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 flex-shrink-0">
                <UserCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>Mode agent humain actif</strong> — L'IA est suspendue. Vos messages sont envoyés directement au client.
                  {selectedSession.humanTakeoverAt && (
                    <span className="text-blue-500 ml-1">
                      (depuis {new Date(selectedSession.humanTakeoverAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Zone de messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {typedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row" : "flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-gray-200 text-gray-600"
                      : msg.role === "csn"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-[#E8751A]/10 text-[#E8751A]"
                  }`}>
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : msg.role === "csn" ? (
                      <Headphones className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Bulle de message */}
                  <div className={`max-w-[72%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                      : msg.role === "csn"
                      ? "bg-blue-500 text-white rounded-tr-sm"
                      : "bg-[#E8751A] text-white rounded-tr-sm"
                  }`}>
                    {msg.role === "csn" && (
                      <p className="text-xs font-semibold text-blue-100 mb-1 flex items-center gap-1">
                        <Headphones className="h-3 w-3" />
                        Vous (Agent NEXUS)
                      </p>
                    )}
                    {msg.role === "assistant" && (
                      <p className="text-xs font-semibold text-orange-100 mb-1 flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        IA NEXUS
                      </p>
                    )}
                    <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.role === "user" ? "text-gray-400" : "text-white/60"
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {typedMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                  <MessageCircle className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">Aucun message</p>
                </div>
              )}
            </div>

            {/* ── Zone de saisie ── */}
            {(selectedSession.status === "open" || selectedSession.adminInterventionActive) && (
              <div className={`border-t p-3 bg-white flex-shrink-0 ${
                selectedSession.adminInterventionActive
                  ? "border-purple-100 bg-purple-50/30"
                  : selectedSession.humanTakeoverActive
                  ? "border-blue-100 bg-blue-50/30"
                  : "border-gray-100"
              }`}>
                {selectedSession.adminInterventionActive ? (
                  /* Mode admin : champ Textarea + bouton violet */
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                      <Headphones className="h-3.5 w-3.5" />
                      Vous intervenez en tant qu'admin — l'IA est suspendue
                    </div>
                    <div className="flex gap-2 items-end">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Votre message à ${selectedSession.visitorName}…`}
                        className="flex-1 text-sm rounded-xl border-purple-200 focus:border-purple-400 resize-none min-h-[60px] max-h-[120px]"
                        disabled={sending}
                        rows={2}
                      />
                      <Button
                        onClick={handleAdminMessage}
                        disabled={!replyText.trim() || sending}
                        size="icon"
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl w-10 h-10 flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-purple-400">
                      Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
                    </p>
                  </div>
                ) : selectedSession.humanTakeoverActive ? (
                  /* Mode agent humain : champ Textarea + bouton bleu */
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                      <Headphones className="h-3.5 w-3.5" />
                      Répondre en tant qu'agent humain — l'IA est suspendue
                    </div>
                    <div className="flex gap-2 items-end">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Votre message à ${selectedSession.visitorName}…`}
                        className="flex-1 text-sm rounded-xl border-blue-200 focus:border-blue-400 resize-none min-h-[60px] max-h-[120px]"
                        disabled={sending}
                        rows={2}
                      />
                      <Button
                        onClick={handleReply}
                        disabled={!replyText.trim() || sending}
                        size="icon"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl w-10 h-10 flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-400">
                      Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
                    </p>
                  </div>
                ) : (
                  /* Mode IA active : champ Input secondaire */
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Bot className="h-3.5 w-3.5 text-[#E8751A]" />
                      L'IA répond automatiquement — vous pouvez intervenir manuellement ci-dessous
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Intervention manuelle à ${selectedSession.visitorName}…`}
                        className="flex-1 text-sm rounded-xl border-gray-200"
                        disabled={sending}
                      />
                      <Button
                        onClick={handleReply}
                        disabled={!replyText.trim() || sending}
                        size="icon"
                        className="bg-[#E8751A] hover:bg-[#d4671a] text-white rounded-xl w-9 h-9 flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Pour suspendre l'IA et prendre le relais complet, cliquez sur <strong>"Prendre le relais"</strong> en haut.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Session fermée */}
            {selectedSession.status !== "open" && !selectedSession.adminInterventionActive && (
              <div className="border-t border-gray-100 p-3 bg-gray-50 flex-shrink-0">
                <p className="text-xs text-gray-400 text-center">
                  Cette session est fermée. Aucun nouveau message ne peut être envoyé.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialog Escalade ── */}
      {showEscaladeDialog && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">Escalader la session</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Escaladez cette conversation vers un agent humain spécialisé. L'IA sera suspendue.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Motif de l'escalade
                </label>
                <Textarea
                  value={escaladeReason}
                  onChange={(e) => setEscaladeReason(e.target.value)}
                  placeholder="Ex: Question technique complexe, besoin de support spécialisé..."
                  className="text-sm rounded-lg border-gray-200 resize-none min-h-[80px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEscaladeDialog(false);
                    setEscaladeReason("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={handleEscalade}
                  disabled={!escaladeReason.trim() || escalateMutation.isPending}
                >
                  Escalader
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
