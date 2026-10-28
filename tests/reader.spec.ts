import { expect, test, type Page } from "@playwright/test";

test("preserves pasted prose, JavaScript, Python, and literal HTML", async ({ page }) => {
  await page.goto("/");
  const text = 'AI answer\n\n```javascript\nconst message = "hello";\n  console.log(message);\n```\n\ndef greet(name):\n\tprint(name)\n\n<script>window.unwanted = true</script>';
  const reader = page.getByRole("textbox", { name: "Your reading text" });
  await paste(page, "", text);
  expect(await reader.textContent()).toBe(text);
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
  await expect(page.getByRole("textbox")).toHaveText("");
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

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`reader stays screen-centered with 8px outer spacing and right-side tools at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const reader = page.getByRole("textbox");
    const tools = page.getByRole("complementary", { name: "Reading preferences" });
    const readerBox = (await reader.boundingBox())!;
    const toolsBox = (await tools.boundingBox())!;
    expect(readerBox.y).toBe(8);
    expect(readerBox.height).toBe(viewport.height - 16);
    expect(readerBox.x + readerBox.width / 2).toBeCloseTo(viewport.width / 2, 0);
    await expect(page.locator(".reading-canvas")).toHaveCSS("border-radius", "24px");
    await expect(page.getByRole("img", { name: "Readspace" })).toBeVisible();
    expect(readerBox.x + readerBox.width).toBeLessThanOrEqual(toolsBox.x);
    expect(toolsBox.x + toolsBox.width).toBe(viewport.width - 8);
    const slider = page.getByRole("slider", { name: "Reading width" });
    await slider.focus();
    await page.keyboard.press("Home");
    const narrowBox = (await reader.boundingBox())!;
    expect(narrowBox.x + narrowBox.width / 2).toBeCloseTo(viewport.width / 2, 0);
    await reader.fill("A long AI response with code\n    print('hello')\n".repeat(300));
    expect(await reader.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  });
}

async function paste(page: Page, html: string, text: string) {
  await page.getByRole("textbox").focus();
  await page.getByRole("textbox").evaluate((element, data) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text/html", data.html);
    clipboard.setData("text/plain", data.text);
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true, cancelable: true }));
  }, { html, text });
}

const formattedContent = `<h2>AI response</h2><p><strong>Important</strong> and <em>useful</em></p><ul><li><p>First bullet</p><ul><li><p>Nested bullet</p></li></ul></li><li><p>Second bullet</p></li></ul><ol start="3"><li><p>Third item</p></li><li><p>Fourth item</p></li></ol><p style="margin-left:32px">Indented paragraph</p><pre><code>def greet(name):
    print(name)
	return name</code></pre><table><tbody><tr><th>Language</th><th>Use</th></tr><tr><td>Python</td><td>Scripts</td></tr></tbody></table>`;

test("formatted paste retains nested lists, numbering, emphasis, indentation, code, and tables", async ({ page }) => {
  await page.goto("/");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(async html => {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob(["AI response"], { type: "text/plain" }),
    })]);
  }, formattedContent);
  await page.getByRole("textbox").press("ControlOrMeta+v");
  const reader = page.getByRole("textbox");
  await expect(reader.locator("h2")).toHaveText("AI response");
  await expect(reader.locator("strong")).toHaveText("Important");
  await expect(reader.locator("em")).toHaveText("useful");
  await expect(reader.locator("ul ul li")).toHaveText("Nested bullet");
  await expect(reader.locator("ol")).toHaveAttribute("start", "3");
  await expect(reader.locator("p").filter({ hasText: /^Indented paragraph$/ })).toHaveCSS("margin-left", "34px");
  await expect(reader.locator("pre")).toHaveText("def greet(name):\n    print(name)\n\treturn name");
  await expect(reader.locator("table tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(reader.locator("pre")).toHaveCSS("font-size", "18px");
});

test("clear formatting keeps content, list markers and code spacing, and supports undo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Clear formatting" })).toBeDisabled();
  await paste(page, formattedContent, "AI response");
  await page.getByRole("button", { name: "Clear formatting" }).click();
  const reader = page.getByRole("textbox");
  await expect(reader.locator("strong, em, h2, ul, ol, pre, table")).toHaveCount(0);
  const text = await reader.textContent();
  expect(text).toContain("• First bullet\n  • Nested bullet\n• Second bullet");
  expect(text).toContain("3. Third item\n4. Fourth item");
  expect(text).toContain("    Indented paragraph");
  expect(text).toContain("def greet(name):\n    print(name)\n\treturn name");
  expect(text).toContain("Language\tUse\nPython\tScripts");
  await page.keyboard.press("ControlOrMeta+z");
  await expect(reader.locator("ul ul li")).toHaveText("Nested bullet");
});

test("paste preserves plain code spacing and strips executable or remote content from rich text", async ({ page }) => {
  await page.goto("/");
  const reader = page.getByRole("textbox");
  const code = "const x = 1;\n    console.log(x);\n\ndef greet():\n\tprint('hello')";
  await paste(page, "", code);
  expect(await reader.textContent()).toBe(code);
  await reader.press("ControlOrMeta+a");
  await paste(page, '<p onclick="window.unwanted = true">Safe text</p><script>window.unwanted = true</script><img src="https://example.com/track" onerror="window.unwanted = true"><a href="javascript:alert(1)">Link text</a><iframe src="https://example.com"></iframe>', "Safe text Link text");
  await expect(reader).toContainText("Safe text");
  await expect(reader).toContainText("Link text");
  await expect(reader.locator("script, img, iframe, [onclick], [onerror], [href^='javascript:']")).toHaveCount(0);
  expect(await page.evaluate(() => "unwanted" in window)).toBe(false);
});


test("font selection loads each font, preserves rich text and code, and survives reload", async ({ page }) => {
  await page.goto("/");
  await paste(page, formattedContent, "AI response");
  const reader = page.getByRole("textbox");
  const html = await reader.innerHTML();
  for (const [value, family] of [["manrope", "Manrope Variable"], ["open-sans", "Open Sans Variable"], ["inter", "Inter Variable"]]) {
    await page.getByRole("combobox", { name: "Font", exact: true }).selectOption(value);
    await expect(reader).toHaveCSS("font-family", `"${family}", sans-serif`);
    expect(await page.evaluate(async name => (await document.fonts.load(`17px "${name}"`)).length, family)).toBeGreaterThan(0);
    expect(await reader.innerHTML()).toBe(html);
    await expect(reader.locator("pre")).toHaveCSS("font-family", 'SFMono-Regular, Consolas, "Liberation Mono", monospace');
  }
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Font", exact: true })).toHaveValue("inter");
  await expect(reader).toHaveText("");
});
