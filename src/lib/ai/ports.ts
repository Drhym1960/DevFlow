export type ProviderStatus = {
  id: string;
  kind: string;
  label: string;
  configured: boolean;
  requires?: string[];
  notes?: string;
};

export type BrandBrief = {
  business: string;
  product: string;
  offer?: string;
  website?: string;
  extra?: string;
  colors?: string[];
  assetLabels?: string[];
  directorPrompt?: string;
  durationSeconds?: number;
};

export type BrandAnalysis = {
  productSummary: string;
  audience: string;
  sellingPoints: string[];
  benefits: string[];
  tone: string;
  bestAssets: string[];
  callToAction: string;
  provider: string;
};

export type ScriptDraft = {
  headline: string;
  voiceover: string;
  beats: { id: string; line: string; visual: string }[];
  cta: string;
  captions: string;
  language: string;
  provider: string;
};

export type LlmProvider = {
  status(): ProviderStatus;
  analyze(brief: BrandBrief): Promise<BrandAnalysis>;
  writeScript(input: {
    brief: BrandBrief;
    analysis: BrandAnalysis;
    goal: string;
    tone: string;
    language: string;
    presenterName: string;
  }): Promise<ScriptDraft>;
  rewriteScript(input: {
    script: ScriptDraft;
    instruction: string;
    language?: string;
  }): Promise<ScriptDraft>;
};

export type TranslationProvider = {
  status(): ProviderStatus;
  translate(text: string, language: string): Promise<string>;
};

export type TtsProvider = {
  status(): ProviderStatus;
  synthesize(input: {
    text: string;
    voiceId: string;
    language: string;
    rate: number;
    tone: string;
    gender?: string;
  }): Promise<{ audioPath: string | null; visemes: { t: number; viseme: string }[]; provider: string }>;
};

export type ImageProvider = {
  status(): ProviderStatus;
  generate(prompt: string): Promise<{ imagePath: string | null; provider: string }>;
};

export type AvatarProvider = {
  status(): ProviderStatus;
  identityFrame(input: {
    seed: string;
    traits: Record<string, string>;
    expression?: string;
  }): Promise<{ svg: string; provider: string }>;
};

export type LipSyncProvider = {
  status(): ProviderStatus;
  align(text: string, language: string): { t: number; viseme: string }[];
};

export type VideoComposer = {
  status(): ProviderStatus;
  render(input: RenderInput): Promise<{ videoPath: string; duration: number }>;
};

export type SceneLayout =
  | "presenter-full"
  | "presenter-left-product-right"
  | "presenter-right-product-left"
  | "presenter-pip"
  | "floating-screens"
  | "product-overlay"
  | "product-only"
  | "studio-presenter"
  | "lifestyle-presenter"
  | "logo-cta";

export type ScenePlan = {
  id: string;
  layout: SceneLayout;
  duration: number;
  line: string;
  caption: string;
  visual: string;
  assetHint?: string;
  presenterPosition: "left" | "right" | "center" | "pip" | "hidden";
  background: string;
};

export type RenderInput = {
  projectId: string;
  format: string;
  width: number;
  height: number;
  scenes: ScenePlan[];
  colors: string[];
  logoPath?: string | null;
  brandName: string;
  cta: string;
  presenterSvg: string;
  music: string;
  assetPaths: string[];
  outDir: string;
  audioPath?: string | null;
  talkFrameDir?: string | null;
  talkVideoPath?: string | null;
};

export type StorageProvider = {
  status(): ProviderStatus;
  save(relPath: string, bytes: Buffer, mime: string): Promise<string>;
  resolve(relPath: string): string;
};

export type PaymentsProvider = {
  status(): ProviderStatus;
  checkoutUrl(planId: string): Promise<string | null>;
};
