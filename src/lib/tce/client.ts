export type TceQueryParams = Record<string, string | number | undefined>;

export type TcePage = {
  url: string;
  startIndex: number;
  rows: Record<string, unknown>[];
};

type TceResponse = {
  elements?: Record<string, unknown>[];
  links?: { rel?: string; href?: string }[];
};

export class TceClient {
  private readonly baseUrl: string;
  private readonly pageSize: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    baseUrl = process.env.TCE_BASE_URL ?? "https://api-dados-abertos.tce.ce.gov.br/sim",
    pageSize = 1000,
    timeoutMs = 20000,
    maxRetries = 2
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.pageSize = pageSize;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  async *paginate(endpoint: string, params: TceQueryParams): AsyncGenerator<TcePage> {
    let startIndex = 0;

    while (true) {
      const url = this.buildUrl(endpoint, {
        ...params,
        $count: this.pageSize,
        $start_index: startIndex
      });

      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`TCE API ${response.status} em ${url}: ${body.slice(0, 500)}`);
      }

      const data = (await response.json()) as TceResponse;
      const rows = Array.isArray(data.elements) ? data.elements : [];

      yield {
        url,
        startIndex,
        rows
      };

      if (rows.length === 0 || rows.length < this.pageSize) {
        break;
      }

      startIndex += this.pageSize;
    }
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          headers: {
            accept: "application/json"
          },
          signal: controller.signal
        });

        clearTimeout(timeout);
        return response;
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`Falha ao consultar ${url}`);
  }

  buildUrl(endpoint: string, params: TceQueryParams): string {
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, "")}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}
