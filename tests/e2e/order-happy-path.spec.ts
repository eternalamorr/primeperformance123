import { test, expect } from "@playwright/test";

test("order happy path works in e2e bypass mode", async ({ request }) => {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";

  const response = await request.post(`${baseURL}/api/orders`, {
    headers: {
      Origin: baseURL,
      Referer: `${baseURL}/`,
      "Content-Type": "application/json",
    },
    data: {
      source: "product",
      consent: true,
      customer: {
        name: "E2E Customer",
        phone: "+79991234567",
      },
      items: [
        {
          id: 1,
          name: "PRIME PERFORMANCE BMW M5 COMPETITION",
          price: "139 990",
          quantity: 1,
        },
      ],
      turnstileToken: "e2e-bypass",
      honeypot: "",
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.ok).toBeTruthy();
});
