const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    executablePath: "/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 900 });

  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("console.error: " + msg.text());
  });

  await page.goto("http://localhost:8791/index.html", { waitUntil: "networkidle0" });

  const statText = await page.$eval("#statStrip", (e) => e.innerText);
  console.log("--- stat strip ---\n" + statText);

  await page.screenshot({ path: "screenshot_overview.png" });

  // open a student trace (click first row)
  await page.click("#tableWrap tbody tr");
  await page.waitForSelector("#overlay.open");
  await page.screenshot({ path: "screenshot_trace.png" });
  await page.click("#closeBtnInner");

  // open a FAILING student's trace (S002) to check the red-pen annotation
  await page.click('#tableWrap tbody tr[data-id="S002"]');
  await page.waitForSelector("#overlay.open");
  await page.screenshot({ path: "screenshot_trace_fail.png" });
  await page.click("#closeBtnInner");

  // click the practical-fail tab
  await page.click('.tab[data-tab="practical"]');
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: "screenshot_practical_list.png" });

  console.log("--- errors ---");
  console.log(errors.length ? errors.join("\n") : "(none)");

  await browser.close();
})();
