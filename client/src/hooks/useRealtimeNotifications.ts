import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook pour les notifications temps réel avec polling
 * Récupère les notifications non lues toutes les 5 secondes
 */
export function useRealtimeNotifications(userId: number | undefined, recipientType: "supplier" | "deliveryman") {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query pour récupérer les notifications
  const notificationsQuery = 
    recipientType === "supplier"
      ? trpc.gas.notifications.getUnreadForSupplier.useQuery(userId || 0, { enabled: !!userId })
      : trpc.gas.notifications.getUnreadForDeliveryman.useQuery(userId || 0, { enabled: !!userId });

  // Mutation pour marquer une notification comme lue
  const markAsReadMutation = trpc.gas.notifications.markAsRead.useMutation();

  useEffect(() => {
    if (!userId) return;

    // Démarrer le polling toutes les 5 secondes
    pollingIntervalRef.current = setInterval(() => {
      notificationsQuery.refetch();
    }, 5000);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userId, notificationsQuery]);

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    markAsRead: (notificationId: number) => markAsReadMutation.mutate(notificationId),
    refetch: notificationsQuery.refetch,
  };
}
