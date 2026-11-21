/**
 * Raqeem | رقيم — Admin-Only PWA & Web Push Service Worker
 *
 * Security & Privacy Rules:
 * - Registered ONLY on /admin routes (scope: /admin) so the PWA is installable
 *   from the Admin Dashboard ONLY, never on public visitor pages.
 * - Network-only pass-through fetch handler: never caches private admin HTML,
 *   orders, or signed child photos in offline CacheStorage.
 * - Never displays child photos, child names, phone numbers, or addresses in push previews.
 * - Clicking a notification focuses or opens the protected /admin/orders/[id] route.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-only pass-through: satisfies PWA installability without caching sensitive admin PII
self.addEventListener("fetch", () => {
  // Let the browser perform normal network requests with session cookies intact.
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "رقيم — طلب جديد",
    body: "وصل طلب جديد. اضغط لعرض التفاصيل",
    url: "/admin/orders",
    tag: "raqeem-new-order",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed && typeof parsed === "object") {
        payload = {
          title:
            typeof parsed.title === "string" && parsed.title.trim()
              ? parsed.title.trim()
              : payload.title,
          body:
            typeof parsed.body === "string" && parsed.body.trim()
              ? parsed.body.trim()
              : payload.body,
          url:
            typeof parsed.url === "string" && parsed.url.startsWith("/admin")
              ? parsed.url
              : "/admin/orders",
          tag:
            typeof parsed.tag === "string" && parsed.tag.trim()
              ? parsed.tag.trim()
              : payload.tag,
        };
      }
    } catch {
      const text = event.data.text();
      if (text && text.trim()) {
        payload.body = text.trim().slice(0, 160);
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/admin-icon-192.png",
      badge: "/icons/admin-icon-192.png",
      dir: "rtl",
      lang: "ar",
      tag: payload.tag,
      renotify: true,
      data: {
        url: payload.url,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/admin/orders";

  // Restrict click navigation to safe internal admin routes only
  const targetPath = rawUrl.startsWith("/admin") ? rawUrl : "/admin/orders";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin)) {
            if ("navigate" in client && typeof client.navigate === "function") {
              return client.navigate(targetUrl).then((navigated) => {
                if (navigated && "focus" in navigated) {
                  return navigated.focus();
                }
                return client.focus();
              });
            }
            if ("focus" in client) {
              return client.focus();
            }
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
