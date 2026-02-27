export interface Product {
  id: number;
  name: string;
  price: string;
  segment?: string;
  description: string;
  fullDescription: string;
  features: string[];
  specs: { label: string; value: string }[];
  colors: { name: string; hex: string; splitHex?: [string, string] }[];
  colorGallery?: Record<string, string[]>;
  isUpgrade?: boolean;
  badge?: string;
  image?: string;
  gallery: string[];
}

export const products: Product[] = [
  {
    id: 1,
    name: "PRIME PERFORMANCE BMW M5 COMPETITION",
    price: "139 990",
    description: "Офисное кресло бизнес‑класса в стиле BMW M5 F90",
    fullDescription:
      "Флагманская модель для переговорных и кабинетов руководителей. Эффектный силуэт BMW M5 F90, выраженная поддержка спины и премиальная отделка делают это кресло сильным акцентом в современном офисе.",
    features: [
      "Натуральная кожа",
      "Премиальный комфорт",
      "Интеллигентная поддержка",
      "Анатомическая посадка",
      "Деловой характер",
    ],
    specs: [
      { label: "Макс. нагрузка", value: "150 кг" },
      { label: "Высота спинки", value: "85 см" },
      { label: "Ширина сиденья", value: "52 см" },
      { label: "Угол наклона", value: "90° - 180°" },
      { label: "Каркас", value: "Сталь" },
      { label: "Гарантия", value: "1 год" },
    ],
    colors: [
      { name: "Черный", hex: "#1a1a1a" },
      { name: "Черно-белый", hex: "#1a1a1a", splitHex: ["#1a1a1a", "#f5f5f5"] },
      { name: "Красный", hex: "#ff2847" },
      { name: "Черно-красный", hex: "#1a1a1a", splitHex: ["#1a1a1a", "#ff2847"] },
      { name: "Оранжевый", hex: "#ff7a1a" },
    ],
    colorGallery: {
      Черный: [
        "/chairs/m5/black/bmw-m5-black-img-1.png",
        "/chairs/m5/black/bmw-m5-black-img-2.png",
        "/chairs/m5/black/bmw-m5-black-img-3.png",
      ],
      "Черно-белый": [
        "/chairs/m5/black-white/bmw-m5-black-white-img-1.png",
        "/chairs/m5/black-white/bmw-m5-black-white-img-2.png",
        "/chairs/m5/black-white/bmw-m5-black-white-img-3.png",
      ],
      Красный: [
        "/chairs/m5/red/bmw-m5-red-img-1.png",
        "/chairs/m5/red/bmw-m5-red-img-2.png",
        "/chairs/m5/red/bmw-m5-red-img-3.png",
      ],
      "Черно-красный": [
        "/chairs/m5/black-red/bmw-m5-black-red-img-1.png",
        "/chairs/m5/black-red/bmw-m5-black-red-img-2.png",
      ],
      Оранжевый: [
        "/chairs/m5/orange/bmw-m5-orange-img-1.png",
        "/chairs/m5/orange/bmw-m5-orange-img-2.png",
        "/chairs/m5/orange/bmw-m5-orange-img-3.png",
      ],
    },
    image: "/chairs/catalog%20main%20photos/m5-catalog-main-photo.png",
    gallery: [
      "/chairs/m5/red/bmw-m5-red-img-1.png",
      "/chairs/m5/black/bmw-m5-black-img-1.png",
      "/chairs/m5/black-white/bmw-m5-black-white-img-1.png",
    ],
  },
  {
    id: 2,
    name: "PRIME PERFORMANCE BMW M4 COMPETITION",
    price: "139 990",
    description: "Премиальное офисное кресло с динамичным характером",
    fullDescription:
      "Бизнес‑класс с агрессивной геометрией BMW M4. Подходит для тех, кто проводит много часов за рабочим столом и ценит баланс эргономики и выразительного дизайна.",
    features: [
      "Натуральная кожа",
      "Спортивная эргономика",
      "Жесткая фиксация",
      "Активная поддержка",
      "Динамичный характер",
    ],
    specs: [
      { label: "Макс. нагрузка", value: "150 кг" },
      { label: "Высота спинки", value: "82 см" },
      { label: "Ширина сиденья", value: "50 см" },
      { label: "Угол наклона", value: "90° - 180°" },
      { label: "Каркас", value: "Сталь" },
      { label: "Гарантия", value: "1 год" },
    ],
    colors: [
      { name: "Черно-оранжевый", hex: "#1a1a1a", splitHex: ["#1a1a1a", "#ff7a1a"] },
      { name: "Черно-белый", hex: "#1a1a1a", splitHex: ["#1a1a1a", "#f5f5f5"] },
      { name: "Черный", hex: "#1a1a1a" },
      { name: "Коричневый", hex: "#6b4a2b" },
    ],
    colorGallery: {
      "Черно-оранжевый": [
        "/chairs/m4/black-orange/bmw-m4-black-orange-img-1.png",
        "/chairs/m4/black-orange/bmw-m4-black-orange-img-2.png",
        "/chairs/m4/black-orange/bmw-m4-black-orange-img-3.png",
      ],
      Черный: [
        "/chairs/m4/black/bmw-m4-black-img-1.png",
        "/chairs/m4/black/bmw-m4-black-img-2.png",
        "/chairs/m4/black/bmw-m4-black-img-3.png",
      ],
      Коричневый: [
        "/chairs/m4/brown/bmw-m4-brown-img-1.png",
        "/chairs/m4/brown/bmw-m4-brown-img-2.png",
      ],
    },
    image: "/chairs/catalog%20main%20photos/m4-catalog-main-photo.png",
    gallery: [
      "/chairs/m4/black/bmw-m4-black-img-1.png",
      "/chairs/m4/black/bmw-m4-black-img-2.png",
      "/chairs/m4/black/bmw-m4-black-img-3.png",
    ],
  },
  {
    id: 3,
    name: "PRIME PERFORMANCE M8 COMPETITION",
    price: "139 990",
    description: "Офисное кресло премиум‑класса с акцентом на статус",
    fullDescription:
      "Выразительная модель в стиле M8: строгий силуэт, мягкая посадка и высокое качество материалов. Подходит для кабинета руководителя и переговорных зон.",
    features: [
      "Премиальная кожа",
      "Усиленная поддержка",
      "Высокий профиль спинки",
      "Выразительная геометрия",
      "Статусный дизайн",
    ],
    specs: [
      { label: "Макс. нагрузка", value: "140 кг" },
      { label: "Высота спинки", value: "87 см" },
      { label: "Ширина сиденья", value: "54 см" },
      { label: "Угол наклона", value: "90° - 180°" },
      { label: "Каркас", value: "Карбон + Сталь" },
      { label: "Гарантия", value: "1 год" },
    ],
    colors: [
      { name: "Черный", hex: "#1a1a1a" },
      { name: "Черно-оранжевый", hex: "#1a1a1a", splitHex: ["#1a1a1a", "#ff7a1a"] },
    ],
    colorGallery: {
      Черный: [
        "/chairs/m8/black/bmw-m8-black-img-1.png",
        "/chairs/m8/black/bmw-m8-black-img-2.png",
      ],
      "Черно-оранжевый": [
        "/chairs/m8/black-orange/bmw-m8-black-orange-img-1.png",
        "/chairs/m8/black-orange/bmw-m8-black-orange-img-2.png",
        "/chairs/m8/black-orange/bmw-m8-black-orange-img-3.png",
      ],
    },
    image: "/chairs/catalog%20main%20photos/m8-catalog-main-photo.png",
    gallery: [
      "/chairs/m8/black/bmw-m8-black-img-1.png",
      "/chairs/m8/black/bmw-m8-black-img-2.png",
      "/chairs/m8/black-orange/bmw-m8-black-orange-img-1.png",
    ],
  },
];

export const productIds = products.map((product) => product.id);
