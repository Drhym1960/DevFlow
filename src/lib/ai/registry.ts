import type { ProviderStatus } from "./ports";
import { openaiLlmProvider } from "./providers/llm/openai";
import { studioCopyProvider } from "./providers/llm/studio-copy";
import { studioTranslator } from "./providers/translate/studio";
import { openaiTtsProvider } from "./providers/tts/openai";
import { elevenLabsTtsProvider } from "./providers/tts/elevenlabs";
import { openaiImageProvider } from "./providers/image/openai";
import { studioAvatarProvider } from "./providers/avatar/studio";
import { studioLipSync } from "./providers/lipsync/studio";
import { ffmpegComposer } from "./providers/video/composer";
import { localStorageProvider } from "./providers/storage/local";
import { studioPayments } from "./providers/payments/studio";

export function llm() {
  return process.env.OPENAI_API_KEY ? openaiLlmProvider : studioCopyProvider;
}

export function translator() {
  return studioTranslator;
}

export function tts() {
  return process.env.ELEVENLABS_API_KEY ? elevenLabsTtsProvider : openaiTtsProvider;
}

export function images() {
  return openaiImageProvider;
}

export function avatars() {
  return studioAvatarProvider;
}

export function lipsync() {
  return studioLipSync;
}

export function video() {
  return ffmpegComposer;
}

export function storage() {
  return localStorageProvider;
}

export function payments() {
  return studioPayments;
}

export function providerRoster(): ProviderStatus[] {
  return [
    openaiLlmProvider.status(),
    studioCopyProvider.status(),
    studioTranslator.status(),
    openaiTtsProvider.status(),
    elevenLabsTtsProvider.status(),
    openaiImageProvider.status(),
    studioAvatarProvider.status(),
    studioLipSync.status(),
    ffmpegComposer.status(),
    localStorageProvider.status(),
    studioPayments.status(),
  ];
}
