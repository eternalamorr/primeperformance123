import { existsSync } from "node:fs";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({ connectionString: databaseUrl });

const updates = [
  {
    id: 1,
    segment: "standard",
    is_upgrade: false,
    image: "/chairs/catalog%20main%20photos/m5-catalog-main-photo.png",
    gallery: [
      "/chairs/m5/red/bmw-m5-red-img-1.png",
      "/chairs/m5/black/bmw-m5-black-img-1.png",
      "/chairs/m5/black-white/bmw-m5-black-white-img-1.png",
    ],
    color_gallery: {
      "Черный": [
        "/chairs/m5/black/bmw-m5-black-img-1.png",
        "/chairs/m5/black/bmw-m5-black-img-2.png",
        "/chairs/m5/black/bmw-m5-black-img-3.png",
      ],
      "Черно-белый": [
        "/chairs/m5/black-white/bmw-m5-black-white-img-1.png",
        "/chairs/m5/black-white/bmw-m5-black-white-img-2.png",
        "/chairs/m5/black-white/bmw-m5-black-white-img-3.png",
      ],
      "Красный": [
        "/chairs/m5/red/bmw-m5-red-img-1.png",
        "/chairs/m5/red/bmw-m5-red-img-2.png",
        "/chairs/m5/red/bmw-m5-red-img-3.png",
      ],
      "Черно-красный": [
        "/chairs/m5/black-red/bmw-m5-black-red-img-1.png",
        "/chairs/m5/black-red/bmw-m5-black-red-img-2.png",
      ],
      "Оранжевый": [
        "/chairs/m5/orange/bmw-m5-orange-img-1.png",
        "/chairs/m5/orange/bmw-m5-orange-img-2.png",
        "/chairs/m5/orange/bmw-m5-orange-img-3.png",
      ],
    },
  },
  {
    id: 2,
    segment: "standard",
    is_upgrade: false,
    image: "/chairs/catalog%20main%20photos/m4-catalog-main-photo.png",
    gallery: [
      "/chairs/m4/black/bmw-m4-black-img-1.png",
      "/chairs/m4/black/bmw-m4-black-img-2.png",
      "/chairs/m4/black/bmw-m4-black-img-3.png",
    ],
    color_gallery: {
      "Черно-оранжевый": [
        "/chairs/m4/black-orange/bmw-m4-black-orange-img-1.png",
        "/chairs/m4/black-orange/bmw-m4-black-orange-img-2.png",
        "/chairs/m4/black-orange/bmw-m4-black-orange-img-3.png",
      ],
      "Черный": [
        "/chairs/m4/black/bmw-m4-black-img-1.png",
        "/chairs/m4/black/bmw-m4-black-img-2.png",
        "/chairs/m4/black/bmw-m4-black-img-3.png",
      ],
      "Коричневый": [
        "/chairs/m4/brown/bmw-m4-brown-img-1.png",
        "/chairs/m4/brown/bmw-m4-brown-img-2.png",
      ],
    },
  },
  {
    id: 3,
    segment: "standard",
    is_upgrade: false,
    image: "/chairs/catalog%20main%20photos/m8-catalog-main-photo.png",
    gallery: [
      "/chairs/m8/black/bmw-m8-black-img-1.png",
      "/chairs/m8/black/bmw-m8-black-img-2.png",
      "/chairs/m8/black-orange/bmw-m8-black-orange-img-1.png",
    ],
    color_gallery: {
      "Черный": [
        "/chairs/m8/black/bmw-m8-black-img-1.png",
        "/chairs/m8/black/bmw-m8-black-img-2.png",
      ],
      "Черно-оранжевый": [
        "/chairs/m8/black-orange/bmw-m8-black-orange-img-1.png",
        "/chairs/m8/black-orange/bmw-m8-black-orange-img-2.png",
        "/chairs/m8/black-orange/bmw-m8-black-orange-img-3.png",
      ],
    },
  },
  {
    id: 99,
    segment: "standard",
    is_upgrade: true,
    image: "/chairs/premium-catalog-card.png",
    gallery: [],
    color_gallery: {},
  },
  {
    id: 201,
    segment: "premium",
    is_upgrade: false,
    image: "/chairs/premium/premium%20main%20photos/bentley.png",
    gallery: [
      "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-1.png",
      "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-2.png",
      "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-3.png",
    ],
    color_gallery: {
      "Бело синий": [
        "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-1.png",
        "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-2.png",
        "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-3.png",
        "/chairs/premium/bentley-continental-gt/white-blue/bentley-continental-gt-white-blue-img-4.png",
      ],
      "Белый": [
        "/chairs/premium/bentley-continental-gt/white/bentley-continental-gt-white-img-1.png",
        "/chairs/premium/bentley-continental-gt/white/bentley-continental-gt-white-img-2.png",
      ],
    },
  },
  {
    id: 202,
    segment: "premium",
    is_upgrade: false,
    image: "/chairs/premium/premium%20main%20photos/ferrari-f12.png",
    gallery: ["/chairs/premium/ferrari-f12/black-yellow/ferrari-f12-img-1.png"],
    color_gallery: {
      "Черно-желтый": ["/chairs/premium/ferrari-f12/black-yellow/ferrari-f12-img-1.png"],
    },
  },
  {
    id: 203,
    segment: "premium",
    is_upgrade: false,
    image: "/chairs/premium/premium%20main%20photos/w223.png",
    gallery: [
      "/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-1.png",
      "/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-2.png",
    ],
    color_gallery: {
      "Черный": [
        "/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-1.png",
        "/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-2.png",
        "/chairs/premium/mercedes-w223/black/mercedes-w223-black-img-3.png",
      ],
      "Тиффани": [
        "/chairs/premium/mercedes-w223/tiffany/mercedes-w223-tiffany-img-1.png",
        "/chairs/premium/mercedes-w223/tiffany/mercedes-w223-tiffany-img-2.png",
        "/chairs/premium/mercedes-w223/tiffany/mercedes-w223-tiffany-img-3.png",
        "/chairs/premium/mercedes-w223/tiffany/mercedes-w223-tiffany-img-4.png",
      ],
    },
  },
  {
    id: 204,
    segment: "premium",
    is_upgrade: false,
    image: "/chairs/premium/premium%20main%20photos/bmw-xm.png",
    gallery: [
      "/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-1.png",
      "/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-2.png",
    ],
    color_gallery: {
      "Черно-красный": [
        "/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-1.png",
        "/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-2.png",
        "/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-3.png",
        "/chairs/premium/bmw-xm/black-red/bmw-xm-black-red-img-4.png",
      ],
    },
  },
  {
    id: 205,
    segment: "premium",
    is_upgrade: false,
    image: "/chairs/premium/premium%20main%20photos/lamborghini.png",
    gallery: [
      "/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-1.png",
      "/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-2.png",
    ],
    color_gallery: {
      "Черно-белый": [
        "/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-1.png",
        "/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-2.png",
        "/chairs/premium/lamborghini-aventador/black-white/lamborghini-aventador-black-white-img-3.png",
      ],
    },
  },
];

const paths = [];
for (const item of updates) {
  if (item.image) paths.push(item.image);
  for (const value of item.gallery || []) paths.push(value);
  for (const list of Object.values(item.color_gallery || {})) {
    for (const value of list) paths.push(value);
  }
}

const toFsPath = (urlPath) => `public${decodeURIComponent(urlPath)}`;
const missingLocal = paths.filter((p) => !existsSync(toFsPath(p)));
if (missingLocal.length > 0) {
  console.error("Found missing local files, aborting update:");
  console.error(missingLocal);
  process.exit(1);
}

for (const item of updates) {
  const payload = {
    segment: item.segment,
    is_upgrade: item.is_upgrade,
    image: item.image,
    gallery: item.gallery,
    color_gallery: item.color_gallery,
  };

  await pool.query(
    `update products
     set segment = $1,
         is_upgrade = $2,
         image = $3,
         gallery = $4::jsonb,
         color_gallery = $5::jsonb
     where id = $6`,
    [
      payload.segment,
      payload.is_upgrade,
      payload.image,
      JSON.stringify(payload.gallery ?? []),
      JSON.stringify(payload.color_gallery ?? {}),
      item.id,
    ]
  );
}

console.log(`Updated ${updates.length} products.`);
await pool.end();
