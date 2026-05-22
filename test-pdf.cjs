// test-pdf.ts
var import_module = require("module");
var import_meta = {};
var myRequire = typeof require !== "undefined" ? require : (0, import_module.createRequire)(typeof import_meta !== "undefined" && import_meta.url ? import_meta.url : `file://${process.cwd()}/server.cjs`);
var pdfParse = myRequire("pdf-parse");
console.log(typeof pdfParse);
