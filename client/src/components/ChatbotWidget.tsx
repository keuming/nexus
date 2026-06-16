/**
 * ChatbotWidget — Widget chatbot IA flottant pour la page publique
 *
 * Comportement :
 * - Bouton flottant en bas à droite (orange, icône robot)
 * - Sur mobile/PWA : fenêtre plein écran (100dvh) pour éviter tout débordement
 * - Sur desktop : fenêtre 360×520px ancrée en bas à droite
 * - Si un agent NEXUS prend la main, affichage "Agent NEXUS" en badge
 * - Polling toutes les 5s pour les réponses NEXUS
 * - Session stockée en localStorage pour persistance
 * - z-index 9999 pour passer au-dessus de tout élément PWA
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SupportCSNModal from "./SupportCSNModal";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Minimize2,
  User,
  Headphones,
  Loader2,
  ChevronDown,
} from "lucide-react";

const SESSION_KEY = "nexus_chat_token";

interface Message {
  id: number;
  role: "user" | "assistant" | "csn";
  content: string;
  createdAt: Date | string;
}

export default function ChatbotWidget() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [nameStep, setNameStep] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  // Détection mobile : écran < 768px
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Écouter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloquer le scroll du body quand le chat est ouvert sur mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  // Restaurer la session depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      setSessionToken(saved);
      setNameStep(false);
    }
  }, []);

  const { data: serverMessages, refetch } = trpc.chatbot.getChatMessages.useQuery(
    { sessionToken: sessionToken! },
    { enabled: !!sessionToken, refetchInterval: isOpen ? 5000 : false }
  );

  const { data: sessionStatus } = trpc.chatbot.getSession.useQuery(
    { token: sessionToken! },
    { enabled: !!sessionToken, refetchInterval: isOpen ? 5000 : false }
  );

  const { playSound } = useNotificationSound();

  // ⚠️ IMPORTANT: Ne pas appeler useWebSocket tant que sessionToken n'est pas défini
  // Cela évite les tentatives de connexion WebSocket répétées et échouées
  const { isConnected: wsIsConnected } = useWebSocket({
    sessionToken: sessionToken || "",
    onAdminIntervention: (data) => {
      playSound("admin");
      refetch();
      toast.info("Un agent NEXUS a pris le relais", {
        description: (data.reason as string) || "Intervention en cours...",
        duration: 5000,
      });
    },
    onMessage: () => {
      playSound("message");
      refetch();
    },
    onSessionUpdate: () => { refetch(); },
    onError: (error) => { console.error("[ChatbotWidget] WS Error:", error); },
  });

  useEffect(() => { setWsConnected(wsIsConnected); }, [wsIsConnected]);

  useEffect(() => {
    if (serverMessages && serverMessages.length > 0) {
      setLocalMessages(serverMessages as Message[]);
      if (!isOpen) {
        const lastMsg = serverMessages[serverMessages.length - 1];
        if (lastMsg.role !== "user") setUnreadCount((n) => n + 1);
      }
    }
  }, [serverMessages, isOpen]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [localMessages, sending, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen, scrollToBottom]);

  const startSession = trpc.chatbot.startSession.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem(SESSION_KEY, data.token);
        setSessionToken(data.token);
        setNameStep(false);
      }
    },
    onError: () => toast.error(t("common", "error")),
  });

  const sendChatMsg = trpc.chatbot.sendChatMessage.useMutation({
    onSuccess: () => { refetch(); },
    onError: () => { setSending(false); toast.error(t("common", "error")); },
    onSettled: () => setSending(false),
  });

  const sendMessage = trpc.chatbot.sendMessage.useMutation({
    onSuccess: () => { refetch(); },
    onError: () => { setSending(false); toast.error(t("common", "error")); },
    onSettled: () => setSending(false),
  });

  const hasCsnMessage = localMessages.some((m) => m.role === "csn");
  const hasAdminIntervention = sessionStatus?.adminInterventionActive ?? false;

  const handleStartChat = () => {
    if (!visitorName.trim()) { toast.error(t("chatbot", "enterName")); return; }
    startSession.mutate({ visitorName: visitorName.trim() });
  };

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !sessionToken || sending) return;
    const content = inputValue.trim();
    setInputValue("");
    setSending(true);
    const tempMsg: Message = { id: Date.now(), role: "user", content, createdAt: new Date() };
    setLocalMessages((prev) => [...prev, tempMsg]);
    if (hasAdminIntervention) {
      sendChatMsg.mutate({ sessionToken, message: content, senderRole: "user" });
    } else {
      sendMessage.mutate({ token: sessionToken, content });
    }
  }, [inputValue, sessionToken, sending, sendMessage, sendChatMsg, hasAdminIntervention]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const resetSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setLocalMessages([]);
    setNameStep(true);
    setVisitorName("");
  };

  // ── Styles adaptatifs mobile/desktop ──────────────────────────────────────
  // Sur mobile : fenêtre plein écran (position fixed, inset-0, z-[9999])
  // Sur desktop : fenêtre 360px ancrée en bas à droite
  const chatWindowStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        // Support dvh pour les navigateurs mobiles modernes
        maxHeight: "100dvh",
        borderRadius: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }
    : {
        position: "fixed",
        bottom: "6rem",
        right: "1.5rem",
        width: "360px",
        maxWidth: "calc(100vw - 2rem)",
        height: isMinimized ? "auto" : "520px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "1rem",
      };

  return (
    <>
      {/* ── Bouton flottant ─────────────────────────────────────────────── */}
      {/* Sur mobile ouvert : masquer le bouton flottant (la fenêtre prend tout l'écran) */}
      {!(isMobile && isOpen) && (
        <div
          className="fixed flex flex-col items-end gap-2"
          style={{
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            // Sur iOS PWA, tenir compte de la safe area en bas
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Bulle d'accroche — masquée sur très petits écrans */}
          {!isOpen && !isMinimized && (
            <div className="hidden sm:block bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-2.5 text-sm text-gray-700 max-w-[200px] text-right animate-bounce-slow">
              <span className="font-medium">{t("nav", "needHelp")}</span>
              <br />
              <span className="text-gray-500 text-xs">{t("nav", "iAmHere")}</span>
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-14 h-14 rounded-full bg-[#E8751A] hover:bg-[#D06015] text-white shadow-lg shadow-orange-900/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Ouvrir le chat"
            style={{ touchAction: "manipulation" }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            {unreadCount > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Fenêtre de chat ─────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="bg-white shadow-2xl border border-gray-100"
          style={chatWindowStyle}
        >
          {/* ── Header ── */}
          <div
            className="flex-shrink-0 bg-gradient-to-r from-[#E8751A] to-[#D06015] px-4 py-3 flex items-center gap-3"
            style={{ paddingTop: isMobile ? "calc(0.75rem + env(safe-area-inset-top, 0px))" : "0.75rem" }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              hasAdminIntervention ? "bg-purple-500/30" : "bg-white/20"
            }`}>
              {hasAdminIntervention || hasCsnMessage
                ? <Headphones className="h-5 w-5 text-white" />
                : <Bot className="h-5 w-5 text-white" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white font-semibold text-sm">
                  {hasAdminIntervention ? "Support NEXUS" : t("chatbot", "title")}
                </p>
                {hasAdminIntervention && (
                  <span className="bg-purple-400 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    Agent en ligne
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  hasAdminIntervention ? "bg-purple-400" : "bg-green-400"
                }`} />
                <p className="text-white/80 text-xs">
                  {hasAdminIntervention
                    ? "Un agent NEXUS vous aide"
                    : hasCsnMessage
                    ? t("chatbot", "humanTakeover")
                    : t("chatbot", "available")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Bouton minimiser — desktop seulement */}
              {!isMobile && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white/70 hover:text-white p-1.5 rounded transition-colors"
                  aria-label={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? <ChevronDown className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1.5 rounded transition-colors"
                aria-label="Fermer"
                style={{ touchAction: "manipulation" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Corps ── */}
          {!isMinimized && (
            <>
              {nameStep ? (
                /* ── Étape prénom ── */
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-gray-50">
                  <div className="w-16 h-16 rounded-full bg-[#E8751A]/10 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-[#E8751A]" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {t("chatbot", "greeting")} — NEXUS !
                    </h3>
                    <p className="text-gray-500 text-sm">{t("chatbot", "enterName")}</p>
                  </div>
                  <div className="w-full max-w-sm space-y-3">
                    <Input
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder={t("chatbot", "namePlaceholder")}
                      onKeyDown={(e) => e.key === "Enter" && handleStartChat()}
                      className="text-center text-base"
                      autoFocus
                    />
                    <Button
                      onClick={handleStartChat}
                      disabled={startSession.isPending}
                      className="w-full bg-[#E8751A] hover:bg-[#D06015] text-white"
                    >
                      {startSession.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : t("chatbot", "startConversation")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bandeau agent humain */}
                  {hasCsnMessage && (
                    <div className="flex-shrink-0 mx-3 mt-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                      <Headphones className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>{t("chatbot", "humanTakeover")}</strong> — {t("chatbot", "humanTakeoverSub")}
                      </p>
                    </div>
                  )}

                  {/* ── Zone messages ── */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto px-4 py-3"
                    style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
                  >
                    <div className="flex flex-col gap-3">
                      {localMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            msg.role === "user"
                              ? "bg-gray-200 text-gray-600"
                              : msg.role === "csn"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-[#E8751A]/10 text-[#E8751A]"
                          }`}>
                            {msg.role === "user"
                              ? <User className="h-3.5 w-3.5" />
                              : msg.role === "csn"
                              ? <Headphones className="h-3.5 w-3.5" />
                              : <Bot className="h-3.5 w-3.5" />}
                          </div>
                          <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
                            msg.role === "user"
                              ? "bg-[#E8751A] text-white rounded-tr-sm"
                              : msg.role === "csn"
                              ? "bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-sm"
                              : "bg-gray-100 text-gray-800 rounded-tl-sm"
                          }`}>
                            {msg.role === "csn" && (
                              <p className="text-xs font-semibold text-blue-500 mb-1">
                                {t("chatbot", "humanAgent")}
                              </p>
                            )}
                            <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Indicateur de frappe */}
                      {sending && (
                        <div className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E8751A]/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 text-[#E8751A]" />
                          </div>
                          <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-1">
                              {[0, 150, 300].map((delay) => (
                                <div
                                  key={delay}
                                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                                  style={{ animationDelay: `${delay}ms` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* ── Zone de saisie ── */}
                  <div
                    className="flex-shrink-0 border-t border-gray-100 p-3 bg-white"
                    style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                  >
                    {adminMode ? (
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <p className="text-xs font-semibold text-blue-600 mb-2">Mode Admin — Intervention Directe</p>
                          <div className="flex gap-2">
                            <Input
                              value={adminInput}
                              onChange={(e) => setAdminInput(e.target.value)}
                              placeholder="Message admin..."
                              className="flex-1 text-sm rounded-lg border-blue-200"
                              disabled={sending}
                            />
                            <Button
                              onClick={() => {
                                if (adminInput.trim()) {
                                  setLocalMessages(prev => [...prev, {
                                    id: Date.now(), role: "csn", content: adminInput, createdAt: new Date()
                                  }]);
                                  setAdminInput("");
                                }
                              }}
                              size="icon"
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-9 h-9 flex-shrink-0"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={t("chatbot", "typeMessage")}
                          className="flex-1 text-sm rounded-xl border-gray-200"
                          disabled={sending}
                          // Sur mobile, éviter le zoom automatique iOS (font-size >= 16px)
                          style={{ fontSize: "16px" }}
                        />
                        <Button
                          onClick={handleSend}
                          disabled={!inputValue.trim() || sending}
                          size="icon"
                          className="bg-[#E8751A] hover:bg-[#D06015] text-white rounded-xl w-10 h-10 flex-shrink-0"
                          style={{ touchAction: "manipulation" }}
                        >
                          {sending
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <p className="text-xs text-gray-400">{t("chatbot", "poweredBy")}</p>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => setAdminMode(!adminMode)}
                          size="sm"
                          variant="outline"
                          className={`h-6 text-xs gap-1 ${
                            adminMode
                              ? "border-blue-300 text-blue-600 bg-blue-50"
                              : "border-purple-200 text-purple-600 hover:bg-purple-50"
                          }`}
                        >
                          <Headphones className="h-3 w-3" />
                          {adminMode ? "Mode Admin" : "Parler à un humain"}
                        </Button>
                        <button
                          onClick={resetSession}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {t("chatbot", "newConversation")}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Support NEXUS */}
      {sessionToken && visitorName && (
        <SupportCSNModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          sessionToken={sessionToken}
          visitorName={visitorName}
        />
      )}
    </>
  );
}
