import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index";
import { logger } from "./lib/logger";
import { startPoller } from "./lib/telegramPoller";

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(
  pinoHttp({
      logger,
          serializers: {
                req(req) {
                        return {
                                  id: req.id,
                                            method: req.method,
                                                      url: req.url?.split("?")[0],
                                                              };
                                                                    },
                                                                          res(res) {
                                                                                  return { statusCode: res.statusCode };
                                                                                        },
                                                                                            },
                                                                                              })
                                                                                              );

                                                                                              app.use(cors());
                                                                                              app.use(express.json());
                                                                                              app.use(express.urlencoded({ extended: true }));
                                                                                              app.use("/api", router);

                                                                                              startPoller();

                                                                                              app.listen(PORT, () => {
                                                                                                logger.info({ port: PORT }, "Servidor iniciado");
                                                                                                });

                                                                                                export default app;