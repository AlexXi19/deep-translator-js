// example.test.ts
import { GoogleTranslator } from "./googleTranslate";

test("Google translate works", async () => {
  const textToTranslate = "Hi";
  const translator = new GoogleTranslator("auto", "es");
  const translatedText = await translator.translate(textToTranslate);
  expect(translatedText).toBe("Hola");
});
