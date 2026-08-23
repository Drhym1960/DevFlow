import { didMotion } from "./did";
import { falMotion } from "./fal";
import { sadTalkerMotion } from "./sadtalker";
import { soraMotion } from "./sora";
import type { MotionProvider } from "./types";

export function motion(): MotionProvider {
  const preferred = process.env.MOTION_PROVIDER;
  if (preferred === "sora" && process.env.OPENAI_API_KEY) return soraMotion;
  if (preferred === "did" && process.env.D_ID_API_KEY) return didMotion;
  if (preferred === "fal" && process.env.FAL_KEY) return falMotion;
  if (preferred === "sadtalker") return sadTalkerMotion;
  if (process.env.D_ID_API_KEY) return didMotion;
  if (process.env.FAL_KEY) return falMotion;
  return sadTalkerMotion;
}

export function motionRoster() {
  return [soraMotion.status(), sadTalkerMotion.status(), didMotion.status(), falMotion.status()];
}
