import type { Lab, CodeStep } from "./labs";

export const aiCodingLabs: Lab[] = [
  {
    id: "ai-rest-api-client",
    name: "Generate REST API Client",
    category: "AI Coding",
    mode: "AI Coding Lab",
    objective: "Use AI to generate a type-safe TypeScript REST API client with error handling and retry logic.",
    steps: [
      {
        code: `// api-client.ts — AI-Generated REST API Client

interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class RestClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\\/$/, ""),
      apiKey: config.apiKey ?? "",
      timeout: config.timeout ?? 10000,
      retries: config.retries ?? 3,
    };
  }

  private async fetchWithRetry<T>(
    path: string,
    options: RequestInit,
    attempt = 1
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(
        \`\${this.config.baseUrl}\${path}\`,
        {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(this.config.apiKey && {
              Authorization: \`Bearer \${this.config.apiKey}\`,
            }),
            ...options.headers,
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(
          \`HTTP \${response.status}: \${response.statusText}\`,
          response.status,
          body
        );
      }

      const data = (await response.json()) as T;
      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (
        attempt < this.config.retries &&
        this.shouldRetry(error)
      ) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise((r) => setTimeout(r, delay));
        return this.fetchWithRetry<T>(path, options, attempt + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof ApiError) {
      return [408, 429, 500, 502, 503, 504].includes(error.status);
    }
    return error instanceof TypeError; // Network error
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(path, { method: "DELETE" });
  }
}

// --- Usage Example ---
interface User {
  id: number;
  name: string;
  email: string;
}

const api = new RestClient({
  baseUrl: "https://api.example.com/v1",
  apiKey: "sk-abc123",
  timeout: 5000,
  retries: 3,
});

// Type-safe API calls
const users = await api.get<User[]>("/users");
const newUser = await api.post<User>("/users", {
  name: "Alice",
  email: "alice@example.com",
});

console.log(\`Created user: \${newUser.data.name}\`);`,
        output: [
          "✓ AI generated api-client.ts (127 lines)",
          "",
          "Features implemented:",
          "  ✓ Generic type-safe responses (ApiResponse<T>)",
          "  ✓ Custom ApiError class with status and body",
          "  ✓ Exponential backoff retry (configurable attempts)",
          "  ✓ Request timeout with AbortController",
          "  ✓ Auto-retry on 408, 429, 5xx, and network errors",
          "  ✓ Bearer token authentication",
          "  ✓ GET, POST, PUT, DELETE methods",
          "",
          "Type checking: PASS (0 errors)",
          "Bundle size: 2.1 KB (minified)",
        ],
        explanation: "The AI generates a production-ready API client with type inference, automatic retries with exponential backoff, timeout handling, and proper error typing.",
      },
    ] as CodeStep[],
    validations: [
      { label: "Type-safe generic responses", pass: true },
      { label: "Retry logic with exponential backoff", pass: true },
      { label: "AbortController timeout handling", pass: true },
      { label: "Proper error class hierarchy", pass: true },
      { label: "TypeScript strict mode compatible", pass: true },
    ],
    explanation: "A well-designed API client abstracts HTTP complexity behind type-safe methods. Key patterns: generic return types for compile-time safety, exponential backoff (2^attempt seconds) to avoid thundering herd, AbortController for timeouts (replacing deprecated timeout options), and selective retry only on transient errors (5xx, 429, network).",
    hints: [
      "Generic types like ApiResponse<T> provide compile-time type checking",
      "Only retry on transient errors — never retry 401 or 404",
      "Exponential backoff prevents overwhelming a struggling server",
    ],
    logs: [
      "[AI] Prompt: Generate type-safe REST client with retries",
      "[AI] Generating api-client.ts...",
      "[AI] Applied patterns: generics, error hierarchy, backoff",
      "[CHECK] TypeScript strict: 0 errors",
      "[CHECK] Bundle size: 2.1 KB minified",
    ],
  },
  {
    id: "ai-refactor-legacy",
    name: "Refactor Legacy Code",
    category: "AI Coding",
    mode: "AI Coding Lab",
    objective: "Use AI to refactor a callback-hell function into clean async/await with proper error handling.",
    steps: [
      {
        code: `// BEFORE — Callback Hell (legacy code)
function processOrder(orderId, callback) {
  getOrder(orderId, function(err, order) {
    if (err) { callback(err); return; }
    validateInventory(order.items, function(err, stock) {
      if (err) { callback(err); return; }
      if (!stock.available) {
        callback(new Error('Out of stock'));
        return;
      }
      chargePayment(order.total, order.payment, function(err, charge) {
        if (err) { callback(err); return; }
        updateOrderStatus(orderId, 'paid', function(err) {
          if (err) { callback(err); return; }
          sendConfirmation(order.email, charge.id, function(err) {
            if (err) { callback(err); return; }
            callback(null, { orderId, chargeId: charge.id });
          });
        });
      });
    });
  });
}

// ─────────────────────────────────────────────
// AFTER — AI Refactored (async/await)
// ─────────────────────────────────────────────

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  payment: PaymentInfo;
  email: string;
}

interface OrderResult {
  orderId: string;
  chargeId: string;
}

class OrderProcessingError extends Error {
  constructor(
    message: string,
    public step: string,
    public cause?: Error
  ) {
    super(message);
    this.name = "OrderProcessingError";
  }
}

async function processOrder(orderId: string): Promise<OrderResult> {
  // Step 1: Retrieve order
  const order = await getOrder(orderId);

  // Step 2: Validate inventory
  const stock = await validateInventory(order.items);
  if (!stock.available) {
    throw new OrderProcessingError(
      \`Items out of stock: \${stock.unavailable.join(", ")}\`,
      "inventory_check"
    );
  }

  // Step 3: Charge payment
  let charge: ChargeResult;
  try {
    charge = await chargePayment(order.total, order.payment);
  } catch (error) {
    throw new OrderProcessingError(
      "Payment processing failed",
      "payment",
      error as Error
    );
  }

  // Step 4: Update order status
  await updateOrderStatus(orderId, "paid");

  // Step 5: Send confirmation (non-blocking)
  sendConfirmation(order.email, charge.id).catch((err) =>
    console.error("Confirmation email failed:", err)
  );

  return { orderId, chargeId: charge.id };
}`,
        output: [
          "✓ AI refactored processOrder (callback → async/await)",
          "",
          "Changes applied:",
          "  ✓ Converted 5 nested callbacks to sequential await",
          "  ✓ Added TypeScript interfaces (Order, OrderResult)",
          "  ✓ Created custom OrderProcessingError with step tracking",
          "  ✓ Made email confirmation non-blocking (fire-and-forget)",
          "  ✓ Added granular error context per processing step",
          "",
          "Diff summary:",
          "  - Lines before: 25 (deeply nested)",
          "  + Lines after:  45 (flat, readable)",
          "  - Cyclomatic complexity: 6 → 2",
          "  - Max nesting depth: 6 → 1",
        ],
        explanation: "The AI flattens callback pyramids into linear async/await flow, adds TypeScript types, creates domain-specific error classes, and makes non-critical operations fire-and-forget.",
      },
    ] as CodeStep[],
    validations: [
      { label: "All callbacks converted to async/await", pass: true },
      { label: "TypeScript interfaces added", pass: true },
      { label: "Custom error class with step tracking", pass: true },
      { label: "Non-critical email made fire-and-forget", pass: true },
      { label: "Cyclomatic complexity reduced", pass: true },
    ],
    explanation: "Refactoring callback hell: each nested callback becomes a sequential `await`. Non-critical side effects (like sending email) use fire-and-forget with `.catch()` to avoid blocking the main flow. Custom error classes with a `step` field make debugging easier in multi-step workflows. The `cause` property chains the original error.",
    hints: [
      "Not every async call needs to block — email can be fire-and-forget",
      "Custom error classes with context make production debugging much easier",
      "Reducing nesting depth is the primary readability win",
    ],
    logs: [
      "[AI] Analyzing callback structure...",
      "[AI] Detected 5 nested callbacks (depth 6)",
      "[AI] Converting to async/await...",
      "[AI] Adding TypeScript types...",
      "[AI] Optimizing: email → fire-and-forget",
      "[METRICS] Complexity: 6 → 2, Depth: 6 → 1",
    ],
  },
  {
    id: "ai-unit-tests",
    name: "Generate Unit Tests",
    category: "AI Coding",
    mode: "AI Coding Lab",
    objective: "Use AI to generate comprehensive unit tests for a shopping cart module with edge cases.",
    steps: [
      {
        code: `// cart.test.ts — AI-Generated Unit Tests

import { describe, it, expect, beforeEach } from "vitest";
import { ShoppingCart, CartItem } from "./cart";

describe("ShoppingCart", () => {
  let cart: ShoppingCart;

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  describe("addItem", () => {
    it("should add a new item to empty cart", () => {
      cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 1 });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].name).toBe("Widget");
    });

    it("should increment quantity for existing item", () => {
      cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 1 });
      cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 2 });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
    });

    it("should throw for zero or negative quantity", () => {
      expect(() =>
        cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 0 })
      ).toThrow("Quantity must be positive");
    });

    it("should throw for negative price", () => {
      expect(() =>
        cart.addItem({ id: "1", name: "Widget", price: -5, quantity: 1 })
      ).toThrow("Price must be non-negative");
    });
  });

  describe("removeItem", () => {
    it("should remove an existing item", () => {
      cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 1 });
      cart.removeItem("1");
      expect(cart.items).toHaveLength(0);
    });

    it("should not throw when removing non-existent item", () => {
      expect(() => cart.removeItem("999")).not.toThrow();
    });
  });

  describe("calculateTotal", () => {
    it("should return 0 for empty cart", () => {
      expect(cart.total).toBe(0);
    });

    it("should calculate total for single item", () => {
      cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 3 });
      expect(cart.total).toBeCloseTo(29.97, 2);
    });

    it("should calculate total for multiple items", () => {
      cart.addItem({ id: "1", name: "Widget", price: 9.99, quantity: 2 });
      cart.addItem({ id: "2", name: "Gadget", price: 24.50, quantity: 1 });
      expect(cart.total).toBeCloseTo(44.48, 2);
    });

    it("should handle floating point precision", () => {
      cart.addItem({ id: "1", name: "A", price: 0.1, quantity: 1 });
      cart.addItem({ id: "2", name: "B", price: 0.2, quantity: 1 });
      expect(cart.total).toBeCloseTo(0.3, 10);
    });
  });

  describe("applyDiscount", () => {
    beforeEach(() => {
      cart.addItem({ id: "1", name: "Widget", price: 100, quantity: 1 });
    });

    it("should apply percentage discount", () => {
      cart.applyDiscount({ type: "percentage", value: 10 });
      expect(cart.total).toBeCloseTo(90, 2);
    });

    it("should apply fixed discount", () => {
      cart.applyDiscount({ type: "fixed", value: 15 });
      expect(cart.total).toBeCloseTo(85, 2);
    });

    it("should not allow total below zero", () => {
      cart.applyDiscount({ type: "fixed", value: 200 });
      expect(cart.total).toBe(0);
    });

    it("should reject discount over 100%", () => {
      expect(() =>
        cart.applyDiscount({ type: "percentage", value: 101 })
      ).toThrow("Invalid discount");
    });
  });

  describe("edge cases", () => {
    it("should handle max quantity (Number.MAX_SAFE_INTEGER)", () => {
      cart.addItem({
        id: "1",
        name: "Widget",
        price: 1,
        quantity: Number.MAX_SAFE_INTEGER,
      });
      expect(cart.items[0].quantity).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle free items (price = 0)", () => {
      cart.addItem({ id: "1", name: "Freebie", price: 0, quantity: 5 });
      expect(cart.total).toBe(0);
      expect(cart.itemCount).toBe(5);
    });
  });
});`,
        output: [
          "✓ AI generated cart.test.ts (18 test cases)",
          "",
          "Test suites: 1 passed",
          "Tests:       18 passed, 0 failed",
          "Coverage:",
          "  Statements : 100% (42/42)",
          "  Branches   : 95.2% (20/21)",
          "  Functions  : 100% (8/8)",
          "  Lines      : 100% (42/42)",
          "",
          "Categories covered:",
          "  ✓ Happy path (6 tests)",
          "  ✓ Edge cases (4 tests)",
          "  ✓ Error handling (4 tests)",
          "  ✓ Boundary values (2 tests)",
          "  ✓ Floating point (1 test)",
          "  ✓ Idempotency (1 test)",
        ],
        explanation: "The AI generates tests covering happy paths, edge cases, error conditions, boundary values, and floating-point precision — achieving near-100% coverage.",
      },
    ] as CodeStep[],
    validations: [
      { label: "Happy path tests cover all methods", pass: true },
      { label: "Edge cases tested (empty, zero, max)", pass: true },
      { label: "Error conditions throw correctly", pass: true },
      { label: "Floating point precision handled", pass: true },
      { label: "100% line coverage achieved", pass: true },
    ],
    explanation: "Comprehensive unit tests follow the pattern: happy path → edge cases → error conditions → boundary values. Use `toBeCloseTo` for floating-point comparisons, `beforeEach` for fresh state, and `describe` blocks for logical grouping. Testing that invalid inputs throw is as important as testing valid inputs succeed.",
    hints: [
      "Always test empty/zero/null inputs as edge cases",
      "Use toBeCloseTo for money/float calculations, never toBe",
      "Group tests by method or behavior with nested describe blocks",
    ],
    logs: [
      "[AI] Analyzing ShoppingCart module...",
      "[AI] Identified 8 public methods to test",
      "[AI] Generating tests: happy path...",
      "[AI] Generating tests: edge cases...",
      "[AI] Generating tests: error handling...",
      "[TESTS] 18/18 passed, 100% line coverage",
    ],
  },
  {
    id: "ai-debug-async",
    name: "Debug Async Race Condition",
    category: "AI Coding",
    mode: "AI Coding Lab",
    objective: "Use AI to identify and fix a race condition in concurrent data fetching code.",
    steps: [
      {
        code: `// BUGGY CODE — Race condition in parallel fetches
// Problem: shared mutable state + uncontrolled concurrency

// ❌ Bug: results array is mutated concurrently
let results = [];

async function fetchAllUsers(userIds: string[]) {
  // This creates a race condition:
  userIds.forEach(async (id) => {
    const user = await fetchUser(id);
    results.push(user); // Race! Order is non-deterministic
  });
  // BUG: returns immediately — forEach doesn't await
  return results; // Always returns empty or partial!
}

// ─────────────────────────────────────────────
// AI FIX — Proper concurrent fetch with control
// ─────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
}

interface FetchResult<T> {
  status: "fulfilled" | "rejected";
  value?: T;
  reason?: Error;
}

// Fix 1: Promise.all for parallel execution
async function fetchAllUsers(userIds: string[]): Promise<User[]> {
  const results = await Promise.all(
    userIds.map((id) => fetchUser(id))
  );
  return results; // Deterministic order, all resolved
}

// Fix 2: Promise.allSettled for fault tolerance
async function fetchAllUsersSafe(
  userIds: string[]
): Promise<FetchResult<User>[]> {
  const results = await Promise.allSettled(
    userIds.map((id) => fetchUser(id))
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return { status: "fulfilled", value: result.value };
    }
    return {
      status: "rejected",
      reason: result.reason as Error,
    };
  });
}

// Fix 3: Controlled concurrency (max 5 parallel)
async function fetchWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 5
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

// Usage:
const users = await fetchWithConcurrencyLimit(
  userIds.map((id) => () => fetchUser(id)),
  5 // max 5 concurrent requests
);`,
        output: [
          "✓ AI identified 3 bugs in fetchAllUsers:",
          "",
          "  Bug 1: forEach + async = fire-and-forget",
          "    forEach does not await async callbacks.",
          "    The function returns before any fetch completes.",
          "",
          "  Bug 2: Shared mutable array (results)",
          "    Global let results = [] causes stale data across calls.",
          "    Multiple invocations share and corrupt the same array.",
          "",
          "  Bug 3: No concurrency control",
          "    1000 userIds = 1000 simultaneous HTTP requests.",
          "    Will overwhelm the server and likely cause failures.",
          "",
          "Fixes applied:",
          "  ✓ Fix 1: Promise.all — parallel with deterministic order",
          "  ✓ Fix 2: Promise.allSettled — tolerates individual failures",
          "  ✓ Fix 3: Worker pool — limits concurrency to N",
          "",
          "Tests: All 3 implementations verified, race condition eliminated.",
        ],
        explanation: "The AI diagnoses the classic forEach+async antipattern, eliminates shared mutable state, and provides three solutions with increasing sophistication: Promise.all, Promise.allSettled, and a concurrency-limited worker pool.",
      },
    ] as CodeStep[],
    validations: [
      { label: "forEach+async antipattern identified", pass: true },
      { label: "Shared mutable state eliminated", pass: true },
      { label: "Promise.all preserves result order", pass: true },
      { label: "Promise.allSettled handles partial failures", pass: true },
      { label: "Concurrency limiter prevents overload", pass: true },
    ],
    explanation: "Common async bugs: `forEach` doesn't await async callbacks — use `Promise.all(arr.map(...))` instead. Shared mutable state outside async functions causes race conditions. For large batches, limit concurrency with a worker pool pattern to avoid overwhelming APIs. `Promise.allSettled` is preferred when partial success is acceptable.",
    hints: [
      "Array.forEach + async = fire-and-forget (the #1 async bug)",
      "Promise.all fails fast — one rejection rejects everything",
      "Promise.allSettled never rejects — gives status per promise",
    ],
    logs: [
      "[AI] Analyzing async code patterns...",
      "[AI] Bug detected: forEach does not await async callbacks",
      "[AI] Bug detected: shared mutable state (global results[])",
      "[AI] Bug detected: unbounded concurrency",
      "[AI] Generating 3 fix variants...",
      "[VERIFIED] Race condition eliminated in all variants",
    ],
  },
];
