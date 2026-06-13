import assert from "node:assert/strict";
import { loadMathJaxForCopy } from "../src/components/wemd-editor/utils/mathJaxLoader";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

let warning: unknown[] | null = null;

async function main() {
  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => ({
          id: "",
          src: "",
          async: false,
          remove: () => {},
        }),
        head: {
          appendChild: (script: { onerror?: () => void }) => {
            script.onerror?.();
          },
        },
      },
    });

    const loaded = await loadMathJaxForCopy((...args) => {
      warning = args;
    });

    assert.equal(loaded, false);
    assert.ok(warning);
    assert.equal((warning[1] as Error).message, "Failed to load MathJax");
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  }
}

void main();
