/**
 * Safe infix expression evaluator for the Supply Run puzzle — integers with
 * + − × ÷ and parentheses, verified against the day's number pool (multiset).
 *
 * Client-safe: contains NO puzzle solutions, so both the browser (live preview
 * of the player's own expression) and the server (authoritative scoring) import
 * it. Kept out of `puzzles.ts` precisely because that module holds the secret
 * word list.
 */
type Tok = { t: "num"; v: number } | { t: "op"; v: string } | { t: "lp" } | { t: "rp" };

function tokenize(tokens: string[]): Tok[] | null {
  const out: Tok[] = [];
  for (const raw of tokens) {
    const t = raw.trim();
    if (t === "") continue;
    if (t === "(") out.push({ t: "lp" });
    else if (t === ")") out.push({ t: "rp" });
    else if (["+", "-", "*", "/", "×", "÷", "−"].includes(t)) {
      const v = t === "×" ? "*" : t === "÷" ? "/" : t === "−" ? "-" : t;
      out.push({ t: "op", v });
    } else if (/^\d+$/.test(t)) out.push({ t: "num", v: parseInt(t, 10) });
    else return null;
  }
  return out;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

export interface NumbersEval {
  ok: boolean;
  value?: number;
  error?: string;
}

export function evaluateExpression(tokens: string[], pool: number[]): NumbersEval {
  const toks = tokenize(tokens);
  if (!toks) return { ok: false, error: "Invalid characters in expression." };
  if (toks.length === 0) return { ok: false, error: "Empty expression." };

  // check number usage against pool multiset
  const avail = new Map<number, number>();
  for (const n of pool) avail.set(n, (avail.get(n) ?? 0) + 1);
  for (const tk of toks) {
    if (tk.t === "num") {
      const left = avail.get(tk.v) ?? 0;
      if (left <= 0) return { ok: false, error: `You can't use ${tk.v} that many times.` };
      avail.set(tk.v, left - 1);
    }
  }

  // shunting-yard
  const output: Tok[] = [];
  const ops: Tok[] = [];
  for (const tk of toks) {
    if (tk.t === "num") output.push(tk);
    else if (tk.t === "op") {
      while (
        ops.length &&
        ops[ops.length - 1].t === "op" &&
        PREC[(ops[ops.length - 1] as { v: string }).v] >= PREC[tk.v]
      ) {
        output.push(ops.pop()!);
      }
      ops.push(tk);
    } else if (tk.t === "lp") ops.push(tk);
    else {
      // rp
      let found = false;
      while (ops.length) {
        const top = ops.pop()!;
        if (top.t === "lp") {
          found = true;
          break;
        }
        output.push(top);
      }
      if (!found) return { ok: false, error: "Mismatched parentheses." };
    }
  }
  while (ops.length) {
    const top = ops.pop()!;
    if (top.t === "lp" || top.t === "rp") return { ok: false, error: "Mismatched parentheses." };
    output.push(top);
  }

  // eval RPN
  const stack: number[] = [];
  for (const tk of output) {
    if (tk.t === "num") stack.push(tk.v);
    else if (tk.t === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined)
        return { ok: false, error: "Malformed expression." };
      let r: number;
      switch (tk.v) {
        case "+": r = a + b; break;
        case "-": r = a - b; break;
        case "*": r = a * b; break;
        case "/":
          if (b === 0) return { ok: false, error: "Division by zero." };
          r = a / b;
          break;
        default: return { ok: false, error: "Unknown operator." };
      }
      stack.push(r);
    }
  }
  if (stack.length !== 1) return { ok: false, error: "Malformed expression." };
  return { ok: true, value: stack[0] };
}
