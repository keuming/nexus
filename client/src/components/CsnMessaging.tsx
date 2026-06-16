import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  RefreshCw,
  Building2,
  Headphones,
  Search,
  Bus,
  UtensilsCrossed,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type CompanyItem = {
  id: number;
  companyName: string;
  activityType: string;
  logoUrl: string | null;
  unreadCount: number;
  lastMessage: { content: string; createdAt: Date } | null;
};

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

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  transport: <Bus className="h-4 w-4" />,
  restauration: <UtensilsCrossed className="h-4 w-4" />,
  expedition: <Package className="h-4 w-4" />,
};

export default function CsnMessaging() {
  const utils = trpc.useUtils();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: companies = [], isLoading: loadingCompanies, refetch: refetchCompanies } =
    trpc.team.companiesWithMessages.useQuery(undefined, { refetchInterval: 20000 });

  const { data: messages = [], isLoading: loadingMessages } =
    trpc.team.listMessagesForCsn.useQuery(
      { companyId: selectedCompanyId! },
      { enabled: !!selectedCompanyId, refetchInterval: 10000 }
    );

  const { data: totalUnread = 0 } = trpc.team.totalUnreadForCsn.useQuery(
    undefined,
    { refetchInterval: 20000 }
  );

  const sendMessage = trpc.team.sendMessageAsCsn.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.team.listMessagesForCsn.invalidate();
      utils.team.companiesWithMessages.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.team.markReadAsCsn.useMutation({
    onSuccess: () => {
      utils.team.companiesWithMessages.invalidate();
      utils.team.totalUnreadForCsn.invalidate();
    },
  });

  // Marquer comme lu quand on sélectionne une compagnie
  useEffect(() => {
    if (selectedCompanyId) {
      markRead.mutate({ companyId: selectedCompanyId });
    }
  }, [selectedCompanyId]);

  // Scroll vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!selectedCompanyId || !newMessage.trim()) return;
    sendMessage.mutate({ companyId: selectedCompanyId, content: newMessage.trim() });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const filteredCompanies = (companies as CompanyItem[]).filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCompany = (companies as CompanyItem[]).find((c) => c.id === selectedCompanyId);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Sidebar — liste des compagnies */}
      <div className="w-72 border-r flex flex-col bg-gray-50">
        <div className="p-3 border-b bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#E8751A]" />
              Messagerie
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{totalUnread}</Badge>
              )}
            </h3>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refetchCompanies()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une compagnie..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingCompanies ? (
            <div className="p-4 text-center text-gray-400 text-sm">Chargement...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              {search ? "Aucune compagnie trouvée" : "Aucune compagnie active"}
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompanyId(company.id)}
                className={`w-full text-left p-3 border-b hover:bg-white transition-colors ${
                  selectedCompanyId === company.id ? "bg-white border-l-2 border-l-[#E8751A]" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E8751A]/10 flex items-center justify-center flex-shrink-0 text-[#E8751A]">
                    {ACTIVITY_ICONS[company.activityType] ?? <Building2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{company.companyName}</p>
                      {company.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-[10px] h-4 min-w-4 px-1 ml-1 flex-shrink-0">
                          {company.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {company.lastMessage ? (
                      <>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {company.lastMessage.content}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {format(new Date(company.lastMessage.createdAt), "dd/MM HH:mm", { locale: fr })}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Aucun message</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {!selectedCompanyId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="h-16 w-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Sélectionnez une compagnie</h3>
            <p className="text-sm text-gray-400 mt-1">
              Choisissez une compagnie dans la liste pour voir et répondre à ses messages.
            </p>
          </div>
        ) : (
          <>
            {/* Header conversation */}
            <div className="p-4 border-b bg-gradient-to-r from-[#E8751A]/5 to-orange-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8751A]/10 flex items-center justify-center text-[#E8751A]">
                {selectedCompany && (ACTIVITY_ICONS[selectedCompany.activityType] ?? <Building2 className="h-5 w-5" />)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedCompany?.companyName}</h3>
                <p className="text-xs text-gray-500 capitalize">{selectedCompany?.activityType}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loadingMessages ? (
                <div className="text-center py-8 text-gray-400">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">Aucun message avec cette compagnie</p>
                  <p className="text-sm text-gray-400 mt-1">Envoyez le premier message !</p>
                </div>
              ) : (
                (messages as Message[]).map((msg) => {
                  const isFromCsn = msg.senderType === "csn";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromCsn ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[75%]">
                        {!isFromCsn && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                              <Building2 className="h-2.5 w-2.5 text-gray-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{msg.senderName}</span>
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            isFromCsn
                              ? "bg-[#E8751A] text-white rounded-tr-sm"
                              : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-1 ${isFromCsn ? "text-right" : "text-left"}`}>
                          {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                          {isFromCsn && " · Support NEXUS"}
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
                  placeholder="Répondre à la compagnie... (Entrée pour envoyer)"
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
              <div className="flex items-center gap-1.5 mt-1">
                <Headphones className="h-3 w-3 text-[#E8751A]" />
                <p className="text-[10px] text-gray-400">
                  Vous répondez en tant que <strong>Support NEXUS NEXUS</strong>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
