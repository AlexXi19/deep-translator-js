// @source: https://github.com/nidhaloff/deep-translator/blob/fa67ada6c5d17617628fb13447de5457a5158dc6/deep_translator/google.py
import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { HttpsProxyAgent } from "https-proxy-agent";

interface ProxyOptions {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

function constructProxyUrl({ host, port, auth }: ProxyOptions): string {
  let url = `http://${host}:${port}`;

  if (auth) {
    const { username, password } = auth;
    url = `http://${username}:${password}@${host}:${port}`;
  }

  return url;
}

export class GoogleTranslator {
  private baseUrl: string;
  private source: string;
  private target: string;
  private proxies: ProxyOptions | null;
  private elementTag: string;
  private elementQuery: { class: string };
  private altElementQuery: { class: string };

  /**
   * A class that wraps functions which use Google Translate to translate text.
   * @param source - Source language to translate from (default is "auto").
   * @param target - Target language to translate to (default is "en").
   * @param proxies - Optional proxies to use for the requests.
   */
  constructor(
    source: string = "auto",
    target: string = "en",
    proxies: ProxyOptions | null = null,
  ) {
    this.baseUrl = "https://translate.google.com/m"; // Replace with actual base URL if different
    this.source = source;
    this.target = target;
    this.proxies = proxies;
    this.elementTag = "div";
    this.elementQuery = { class: "t0" };
    this.altElementQuery = { class: "result-container" };
  }

  /**
   * Function to validate input text.
   * @param text - Text to validate.
   * @param maxChars - Maximum number of characters allowed.
   * @returns - Returns true if valid, false otherwise.
   */
  private isInputValid(text: string, maxChars: number = 5000): boolean {
    return !!text && text.length > 0 && text.length <= maxChars;
  }

  /**
   * Translate text using Google Translate.
   * @param text - Text to translate.
   * @returns - Translated text.
   */
  async translate(text: string): Promise<string> {
    if (!this.isInputValid(text)) throw new Error("Invalid input text");

    const urlParams = {
      sl: this.source,
      tl: this.target,
      q: text.trim(),
    };

    const config: AxiosRequestConfig = {
      params: urlParams,
      httpsAgent: this.proxies
        ? new HttpsProxyAgent(constructProxyUrl(this.proxies))
        : undefined,
    };

    const response = await axios.get(this.baseUrl, config);

    if (response.status === 429) throw new Error("Too Many Requests");

    const $ = cheerio.load(response.data);
    let element = $(this.elementTag).filter((_, el) =>
      $(el).hasClass(this.elementQuery.class),
    );
    if (!element.length) {
      element = $(this.elementTag).filter((_, el) =>
        $(el).hasClass(this.altElementQuery.class),
      );
      if (!element.length) throw new Error("Translation Not Found");
    }

    return element.text().trim();
  }

  /**
   * Translate text from a file.
   * @param path - Path to the file.
   * @returns - Translated content of the file.
   */
  async translateFile(_path: string): Promise<string> {
    throw new Error("Not Implemented");
  }

  /**
   * Translate a batch of texts.
   * @param batch - List of texts to translate.
   * @returns - List of translated texts.
   */
  async translateBatch(batch: string[]): Promise<string[]> {
    return Promise.all(batch.map((text) => this.translate(text)));
  }
}

export default GoogleTranslator;
