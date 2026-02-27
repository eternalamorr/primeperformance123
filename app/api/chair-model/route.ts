import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { join } from "node:path";

export const runtime = "nodejs";

const MODEL_PATH = join(
  process.cwd(),
  "models",
  "766e7299c962b7daa4070f9bfa59fbfc.glb"
);

export async function GET() {
  try {
    const fileStat = await stat(MODEL_PATH);
    const stream = createReadStream(MODEL_PATH);

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to load chair model:", error);
    return new Response("Model not found", { status: 404 });
  }
}
