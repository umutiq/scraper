const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const allNextLevel = require("./nxtlvl-all.json");
puppeteer.use(StealthPlugin());
const products = [];

puppeteer.launch({ headless: true }).then(async (browser) => {
  for await (const nextLevel of allNextLevel) {
    const page = await browser.newPage();
    await page.goto(nextLevel);
    let product = await page.evaluate(() => {
      function camelCase(str) {
        return str
          .replace(/\s(.)/g, function (a) {
            return a.toUpperCase();
          })
          .replace(/\s/g, "")
          .replace(/^(.)/, function (b) {
            return b.toLowerCase();
          });
      }
      let product = {
        specs: {},
        manufacturerInfo: {},
      };
      const specifications = Array.from(
        document.querySelectorAll(
          "#accordionSpecifications .panel-body ul .liUnit"
        )
      );
      specifications?.forEach((spec) => {
        product.specs[camelCase(spec.querySelector("label")?.innerText)] =
          spec.querySelector("span")?.innerText;
      });

      const manufacturerInfo = Array.from(
        document.querySelectorAll(
          "#accordionManufacturerInfo .panel-body ul .liUnit"
        )
      );
      manufacturerInfo?.forEach((info) => {
        if (info.querySelector("span")) {
          product.manufacturerInfo[
            camelCase(info.querySelector("label")?.innerText)
          ] = info.querySelector("span")?.innerText;
        }
      });

      product.name = document.querySelector(".unitTitle h1")?.innerText;
      product.price = document.querySelector(".price-value")?.innerText;
      product.description = document.querySelector(
        "#accordionInfo .panel-body"
      )?.innerHTML;
      product["images"] = Array.from(
        document.querySelectorAll(
          "#accordionPhotos .panel-body .image-gallery .photo img"
        )
      ).map((a) => a.getAttribute("href"));
      return product;
    });
    products.push(product);
    console.log(product);
    await page.close();
  }

  fs.writeFileSync("nextlevel2.json", JSON.stringify(products));
  browser.close();
});
