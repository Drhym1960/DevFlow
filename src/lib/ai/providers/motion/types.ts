import type { ProviderStatus } from "@/lib/ai/ports";

export type MotionRequest = {
  sourceImage: string;
  audioPath: string;
  outPath: string;
  still?: boolean;
  prompt?: string;
};

export type MotionProvider = {
  status(): ProviderStatus;
  animate(input: MotionRequest): Promise<{ videoPath: string; provider: string }>;
};
