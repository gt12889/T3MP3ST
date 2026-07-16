import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const llm = readFileSync(join(process.cwd(), 'src/llm/index.ts'), 'utf8');
const config = readFileSync(join(process.cwd(), 'src/config/index.ts'), 'utf8');

describe('OpenAI rate controls', () => {
  it('paces OpenAI calls for the current project limits', () => {
    expect(llm).toContain('OPENAI_MAX_CONCURRENCY = 2');
    expect(llm).toContain('OPENAI_MIN_INTERVAL_MS = 7000');
    expect(llm).toContain('acquireOpenAIRateSlot');
  });

  it('retries 429s with Retry-After and a four-attempt backoff policy', () => {
    expect(llm).toContain("response.headers.get('retry-after')");
    expect(llm).toContain('this.retryAttempts = 4');
    expect(llm).toContain('this.retryDelayMs = 10000');
  });

  it('defaults OpenAI to Luna with the mini fallback and 2000 tokens', () => {
    expect(config).toContain("defaultModel: 'gpt-5.6-luna'");
    expect(config).toContain('maxTokens: 2000');
    expect(llm).toContain("model: 'gpt-5.4-mini'");
  });
});
