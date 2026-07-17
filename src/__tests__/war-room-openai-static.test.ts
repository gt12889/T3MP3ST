import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'docs/index.html'), 'utf8');

function block(startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  expect(start, `missing marker "${startMarker}"`).toBeGreaterThanOrEqual(0);
  const end = source.indexOf(endMarker, start);
  expect(end, `missing end marker "${endMarker}"`).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('War Room OpenAI key routing', () => {
  it('returns the saved OpenAI key from the common key lookup', () => {
    const fn = block('function getApiKey()', '\n        }');
    expect(fn).toContain('state.settings?.openaiKey');
  });

  it('resolves a saved OpenAI key as the OpenAI backend', () => {
    const fn = block('function resolveLLMBackend()', '\n        }');
    expect(fn).toContain("return { kind: 'openai', key: oaKey }");
  });

  it('uses the OpenAI endpoint and removes the provider prefix from model IDs', () => {
    const modelFn = block('function openAIModel(', '\n        }');
    const callFn = block('async function _safeLLMCallOnce(', '\n        }');
    expect(modelFn).toContain("m.slice('openai/'.length)");
    expect(callFn).toContain('https://api.openai.com/v1/chat/completions');
  });

  it('counts a browser key as an available War Room backend', () => {
    const fn = block('function hasBackend()', '\n  }');
    expect(fn).toContain("typeof getApiKey === 'function'");
    expect(fn).toContain('browserKey || api.llmAvailable');
  });

  it('loads project-available models from the OpenAI Models API', () => {
    const fn = block('async function refreshOpenAIModels()', '\n        }');
    expect(fn).toContain('https://api.openai.com/v1/models');
    expect(fn).toContain('isOpenAIChatModel');
    expect(fn).toContain('state.settings.openaiModels = ids');
  });

  it('uses modern token parameters for GPT-5 and reasoning models', () => {
    const fn = block('async function _safeLLMCallOnce(', '\n        }');
    expect(fn).toContain('max_completion_tokens');
  });
});
