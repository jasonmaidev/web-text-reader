import { expect, test } from "@playwright/test";

test("preserves pasted prose, JavaScript, Python, and literal HTML", async ({ page }) => {
  await page.goto("/");
  const text = 'AI answer\n\n```javascript\nconst message = "hello";\n  console.log(message);\n```\n\ndef greet(name):\n\tprint(name)\n\n<script>window.unwanted = true</script>';
  const reader = page.getByRole("textbox", { name: "Your reading text" });
  await reader.fill(text);
  await expect(reader).toHaveValue(text);
  await expect(page.locator(".text-stats")).toContainText(`${text.length} characters`);
  expect(await page.evaluate(() => "unwanted" in window)).toBe(false);
});

test("font controls change the text and stop at supported bounds", async ({ page }) => {
  await page.goto("/");
  const reader = page.getByRole("textbox");
  await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(reader).toHaveCSS("font-size", "18px");
  for (let i = 0; i < 6; i++) await page.getByRole("button", { name: "Decrease text size" }).click();
  await expect(reader).toHaveCSS("font-size", "12px");
  await expect(page.getByRole("button", { name: "Decrease text size" })).toBeDisabled();
});

test("width and theme are adjustable and preferences survive reload without saving text", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".reading-canvas");
  const before = await canvas.boundingBox();
  const slider = page.getByRole("slider", { name: "Reading width" });
  await slider.focus();
  await page.keyboard.press("Home");
  expect((await canvas.boundingBox())!.width).toBeLessThan(before!.width);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("textbox").fill("Temporary private text");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  await expect(page.getByRole("textbox")).toHaveValue("");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass("dark");
});

test("mobile controls and long unbroken code stay within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("textbox").fill("const longCode = '" + "x".repeat(500) + "';");
  const slider = page.getByRole("slider");
  await slider.focus();
  await page.keyboard.press("End");
  await page.getByRole("button", { name: "Increase text size" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("button", { name: "Dark", exact: true })).toBeVisible();
});
