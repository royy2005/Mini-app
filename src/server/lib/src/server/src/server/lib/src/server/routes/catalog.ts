// ═══════════════════════════════════════════════════
// FILE: catalog.ts
// ═══════════════════════════════════════════════════

import { Router, type IRouter } from "express";
import crypto from "crypto";
import {
  getCatalog,
    getCatalogStats,
      deleteFromCatalog,
        updateInCatalog,
          getImageDiskPath,
            getImageRedirectUrl,
            } from "../lib/telegramPoller";

            const router: IRouter = Router();

            const ADMIN_ID = 6414656161;
            const TOKEN    = process.env.TELEGRAM_BOT_TOKEN || "";

            function getValidatedUserId(initData: string): number | null {
              try {
                  if (!initData) return null;
                      const params = new URLSearchParams(initData);
                          const hash   = params.get("hash");
                              if (!hash) return null;

                                  params.delete("hash");

                                      const dataCheckString = [...params.entries()]
                                            .sort(([a], [b]) => a.localeCompare(b))
                                                  .map(([k, v]) => `${k}=${v}`)
                                                        .join("\n");

                                                            const secretKey    = crypto.createHmac("sha256", "WebAppData").update(TOKEN).digest();
                                                                const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

                                                                    if (expectedHash !== hash) return null;

                                                                        const userStr = params.get("user");
                                                                            if (!userStr) return null;

                                                                                const user = JSON.parse(userStr) as { id?: number };
                                                                                    return typeof user.id === "number" ? user.id : null;
                                                                                      } catch {
                                                                                          return null;
                                                                                            }
                                                                                            }

                                                                                            function requireAdmin(req: import("express").Request, res: import("express").Response): boolean {
                                                                                              const initData = (req.headers["x-telegram-init-data"] as string) || "";
                                                                                                const userId   = getValidatedUserId(initData);
                                                                                                  if (userId !== ADMIN_ID) {
                                                                                                      res.status(403).json({ error: "Forbidden" });
                                                                                                          return false;
                                                                                                            }
                                                                                                              return true;
                                                                                                              }

                                                                                                              // ── Rutas ─────────────────────────────────────────────────────────────────────

                                                                                                              router.get("/catalog", (_req, res) => {
                                                                                                                res.json(getCatalog());
                                                                                                                });

                                                                                                                router.get("/catalog/stats", (_req, res) => {
                                                                                                                  res.json(getCatalogStats());
                                                                                                                  });

                                                                                                                  /**
                                                                                                                   * Imágenes:
                                                                                                                    *  1. Si el archivo está en disco (historial MTProto) → lo sirve directo.
                                                                                                                     *  2. Si tiene file_id (post nuevo por Bot API)       → resuelve URL y redirige.
                                                                                                                      *  3. Si no existe → 404.
                                                                                                                       */
                                                                                                                       router.get("/catalog/img/:id", async (req, res) => {
                                                                                                                         // 1. Disco
                                                                                                                           const diskPath = getImageDiskPath(req.params.id);
                                                                                                                             if (diskPath) {
                                                                                                                                 res.set("Content-Type", "image/jpeg");
                                                                                                                                     res.set("Cache-Control", "public, max-age=86400");
                                                                                                                                         return res.sendFile(diskPath);
                                                                                                                                           }

                                                                                                                                             // 2. URL lazy (Bot API file_id)
                                                                                                                                               const url = await getImageRedirectUrl(req.params.id);
                                                                                                                                                 if (!url) return res.status(404).end();

                                                                                                                                                   return res.redirect(302, url);
                                                                                                                                                   });

                                                                                                                                                   router.delete("/catalog/:id", (req, res) => {
                                                                                                                                                     if (!requireAdmin(req, res)) return;

                                                                                                                                                       const deleted = deleteFromCatalog(req.params.id);
                                                                                                                                                         if (!deleted) { res.status(404).json({ error: "Not found" }); return; }

                                                                                                                                                           res.json({ success: true });
                                                                                                                                                           });

                                                                                                                                                           router.patch("/catalog/:id", (req, res) => {
                                                                                                                                                             if (!requireAdmin(req, res)) return;

                                                                                                                                                               const allowed = ["title", "year", "type", "genres", "audio", "quality", "duration", "synopsis", "link"];
                                                                                                                                                                 const patch: Record<string, unknown> = {};
                                                                                                                                                                   for (const key of allowed) {
                                                                                                                                                                       if (key in req.body) patch[key] = req.body[key];
                                                                                                                                                                         }

                                                                                                                                                                           const updated = updateInCatalog(req.params.id, patch);
                                                                                                                                                                             if (!updated) { res.status(404).json({ error: "Not found" }); return; }

                                                                                                                                                                               res.json(updated);
                                                                                                                                                                               });

                                                                                                                                                                               export default router;
                                                                                                                                                                               