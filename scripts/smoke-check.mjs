const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const e2eBypassEnabled = process.env.E2E_BYPASS_TURNSTILE === "1";
const e2eFakeOrderEnabled = process.env.E2E_FAKE_ORDER === "1";

const mustOk = async (path, init) => {
  const res = await fetch(`${baseUrl}${path}`, init);
  if (!res.ok) {
    throw new Error(`${path} returned ${res.status}`);
  }
  return res;
};

try {
  await mustOk("/");

  const productsRes = await mustOk("/api/products");
  const products = await productsRes.json();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("/api/products returned empty catalog");
  }

  const premium = products.filter((item) => item.segment === "premium");
  if (premium.length === 0) {
    throw new Error("No premium products in /api/products");
  }

  const imageCandidates = products
    .map((item) => item.image)
    .filter((image) => typeof image === "string" && image.startsWith("/"))
    .slice(0, 3);
  for (const image of imageCandidates) {
    await mustOk(image, { method: "HEAD" });
  }

  await mustOk("/api/chair-model?v=20260213", { method: "HEAD" });
  await mustOk("/api/product-extras");

  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
    },
    body: JSON.stringify({
      source: "cart",
      consent: true,
      customer: { name: "Smoke Test", phone: "+70000000000" },
      items: [],
      turnstileToken: e2eBypassEnabled ? "e2e-bypass" : "",
    }),
  });

  if (e2eBypassEnabled || e2eFakeOrderEnabled) {
    if (orderRes.status !== 200) {
      throw new Error(`/api/orders should return 200 in E2E mode, got ${orderRes.status}`);
    }
  } else if (![400, 429, 500].includes(orderRes.status)) {
    throw new Error(`/api/orders validation check returned unexpected ${orderRes.status}`);
  }

  console.log("Smoke check passed.");
  console.log(`- baseUrl: ${baseUrl}`);
  console.log(`- products: ${products.length}`);
  console.log(`- premium: ${premium.length}`);
  console.log(`- orders-validation-status: ${orderRes.status}`);
} catch (error) {
  console.error("Smoke check failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
