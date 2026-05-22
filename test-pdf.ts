import { createRequire } from 'module';
const myRequire = typeof require !== 'undefined' ? require : createRequire((typeof import.meta !== 'undefined' && import.meta.url) ? import.meta.url : `file://${process.cwd()}/server.cjs`);
const pdfParse = myRequire('pdf-parse');
console.log(typeof pdfParse);
