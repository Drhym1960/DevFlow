import { images, storage } from "@/lib/ai/registry";

export async function saveGeneratedImage(prompt: string, relPath: string) {
  const generated = await images().generate(prompt);
  if (!generated.imagePath) return null;
  if (!generated.imagePath.startsWith("http")) return generated.imagePath;
  const res = await fetch(generated.imagePath);
  if (!res.ok) return null;
  await storage().save(relPath, Buffer.from(await res.arrayBuffer()), "image/png");
  return relPath;
}
