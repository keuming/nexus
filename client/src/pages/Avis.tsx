import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${rating >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function Avis() {
  return (
    <DashboardLayout>
      <AvisContent />
    </DashboardLayout>
  );
}

function AvisContent() {
  const utils = trpc.useUtils();
  const { data: reviews, isLoading } = trpc.reviews.adminList.useQuery();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const approveMutation = trpc.reviews.approve.useMutation({
    onSuccess: (_, vars) => {
      utils.reviews.adminList.invalidate();
      toast.success(vars.approved ? "Avis approuvé" : "Avis rejeté");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.adminList.invalidate();
      toast.success("Avis supprimé");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = reviews?.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const pendingCount = reviews?.filter((r) => !r.approved).length ?? 0;
  const approvedCount = reviews?.filter((r) => r.approved).length ?? 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Gestion des avis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modérez les commentaires clients avant publication
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("all")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reviews?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("pending")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("approved")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approuvés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: "Tous" },
          { key: "pending", label: `En attente${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          { key: "approved", label: "Approuvés" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key as any)}
            className={filter === tab.key ? "bg-[oklch(0.25_0.07_250)] text-white" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">
              {filter === "pending" ? "Aucun avis en attente" : filter === "approved" ? "Aucun avis approuvé" : "Aucun avis pour le moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <Card key={review.id} className={`transition-all ${!review.approved ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {review.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">{review.clientName}</span>
                        {review.clientEmail && (
                          <span className="text-xs text-muted-foreground">{review.clientEmail}</span>
                        )}
                        <Badge
                          className={`text-xs ${
                            review.approved
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0"
                          }`}
                        >
                          {review.approved ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Approuvé</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" />En attente</>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <StarDisplay rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </span>
                      </div>

                      {review.hotelName && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Établissement : <span className="font-medium text-foreground">{review.hotelName}</span>
                        </p>
                      )}

                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!review.approved ? (
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => approveMutation.mutate({ id: review.id, approved: true })}
                        disabled={approveMutation.isPending}
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                        Approuver
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-200 text-amber-600 hover:bg-amber-50"
                        onClick={() => approveMutation.mutate({ id: review.id, approved: false })}
                        disabled={approveMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Retirer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm("Supprimer définitivement cet avis ?")) {
                          deleteMutation.mutate({ id: review.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
