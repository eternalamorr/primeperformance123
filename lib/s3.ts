import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let s3: S3Client | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function getS3Bucket() {
  return requireEnv("S3_BUCKET");
}

export function getS3Client() {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION?.trim() || "ru-1",
      endpoint: requireEnv("S3_ENDPOINT"),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "0",
      credentials: {
        accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  return s3;
}

export async function uploadPublicObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: ArrayBuffer;
  contentType: string;
}) {
  const client = getS3Client();
  const bucket = getS3Bucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(body),
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }

  const endpoint = requireEnv("S3_ENDPOINT").replace(/\/$/, "");
  return `${endpoint}/${bucket}/${key}`;
}

