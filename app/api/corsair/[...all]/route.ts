import { corsair } from "@/db/index";
import { toNextJsHandler } from "corsair";

export const { GET, POST } = toNextJsHandler(corsair);
