import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  const baseUrl = NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/ar", "/en"],
        disallow: ["/admin", "/admin/", "/api/", "/ar/order/success", "/en/order/success"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
