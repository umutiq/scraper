const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const allEagleMarine = require("./eaglemarine-all.json");
puppeteer.use(StealthPlugin());
const products = [];

puppeteer.launch({ headless: true }).then(async (browser) => {
  for await (const eagleMarine of allEagleMarine) {
    const page = await browser.newPage();
    await page.goto(eagleMarine);
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
        document.querySelectorAll(".unitHighlights ul li.liUnit")
      );
      specifications?.forEach((spec) => {
        product.specs[
          camelCase(spec.querySelector(".lblUnitLabel")?.innerText)
        ] = spec.querySelector(".spnUnitValue")?.innerText;
      });

      const manufacturerInfo = Array.from(
        document.querySelectorAll(".unitSpecifications ul li.unitSpec")
      );
      manufacturerInfo?.forEach((info) => {
        if (info.querySelector("span")) {
          product.manufacturerInfo[
            camelCase(info.querySelector("label")?.innerText)
          ] = info.querySelector("span")?.innerText;
        }
      });

      product.name = document.querySelector(".unitTitle h1")?.innerText;
      product.price = document.querySelector(".unitPrice h2")?.innerText;
      product.description = document.querySelector(
        ".unitDetailsInfo .panel-body"
      )?.innerHTML;
      product["images"] = Array.from(
        document.querySelectorAll(".unitDetailsGallery .panel-body .photo a")
      ).map((a) => a.dataset.src);
      return product;
    });
    console.log(product);
    products.push(product);
    console.log(product);
    await page.close();
  }

  fs.writeFileSync("eaglemarine.json", JSON.stringify(products));
  browser.close();
});
