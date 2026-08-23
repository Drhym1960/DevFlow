import { didMotion } from "./did";
import { falMotion } from "./fal";
import { sadTalkerMotion } from "./sadtalker";
import type { MotionProvider } from "./types";

export function motion(): MotionProvider {
  if (process.env.D_ID_API_KEY) return didMotion;
  if (process.env.FAL_KEY) return falMotion;
  return sadTalkerMotion;
}

export function motionRoster() {
  return [sadTalkerMotion.status(), didMotion.status(), falMotion.status()];
}
