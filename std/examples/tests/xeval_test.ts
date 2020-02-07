import { xeval } from "../xeval.ts";
import { stringsReader } from "../../io/util.ts";
import { decode, encode } from "../../strings/mod.ts";
import {
  assertEquals,
  assertStrContains,
  assert
} from "../../testing/asserts.ts";
import { test } from "../../testing/mod.ts";
const { execPath, run } = Deno;

test(async function xevalSuccess(): Promise<void> {
  const chunks: string[] = [];
  await xeval(stringsReader("a\nb\nc"), ($): number => chunks.push($));
  assertEquals(chunks, ["a", "b", "c"]);
});

test(async function xevalDelimiter(): Promise<void> {
  const chunks: string[] = [];
  await xeval(stringsReader("!MADMADAMADAM!"), ($): number => chunks.push($), {
    delimiter: "MADAM"
  });
  assertEquals(chunks, ["!MAD", "ADAM!"]);
});

// https://github.com/denoland/deno/issues/2861
const xevalPath = "examples/xeval.ts";

test(async function xevalCliReplvar(): Promise<void> {
  const p = run({
    args: [execPath(), xevalPath, "--", "--replvar=abc", "console.log(abc)"],
    stdin: "piped",
    stdout: "piped",
    stderr: "null"
  });
  assert(p.stdin != null);
  await p.stdin.write(encode("hello"));
  await p.stdin.close();
  assertEquals(await p.status(), { code: 0, success: true });
  assertEquals(decode(await p.output()).trimEnd(), "hello");
});

test(async function xevalCliSyntaxError(): Promise<void> {
  const p = run({
    args: [execPath(), xevalPath, "--", "("],
    stdin: "null",
    stdout: "piped",
    stderr: "piped"
  });
  assertEquals(await p.status(), { code: 1, success: false });
  assertEquals(decode(await p.output()), "");
  assertStrContains(decode(await p.stderrOutput()), "Uncaught SyntaxError");
});
