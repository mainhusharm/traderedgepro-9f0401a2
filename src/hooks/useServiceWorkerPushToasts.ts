import { useEffect } from "react";
import { toast } from "sonner";

type ServiceWorkerPushPayload = {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown> & { url?: string };
};

export function useServiceWorkerPushToasts() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.type !== "PUSH_RECEIVED") return;

      const payload = (msg.payload || {}) as ServiceWorkerPushPayload;
      const title = payload.title || "Notification";
      const description = payload.body || "";

      // Avoid noisy empty toasts
      if (!title && !description) return;

      toast(title, {
        description,
        action: payload.data?.url
          ? {
              label: "Open",
              onClick: () => {
                window.location.href = payload.data!.url!;
              },
            }
          : undefined,
      });
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);
}
