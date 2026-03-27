"use strict";

const SAMPLES = [
  `// Muestra 1: pseudocódigo completo
if (x := 10) {
  pepe := x + 25;
  for (i := 0; i <= 100; i := i + 1) {
    print(pepe);
  }
}
resultado := pepe * 3 - asdfg + 7;
nombre10ch := 42;
nombreDemasiadoLargo := 99;
cadena := "hola asdfg mundo";
if (resultado <> 0) {
  int contador := resultado / 2;
}
arr[0] := (50 + 30);
datos[1..5] := 0;
`,
  `# Muestra 2: todos los tipos de error
int total := 0
for i in [0..10]:
    total := total + i

identificadorMuyLargoQueExcede := 50

limite := 250

val := 123abc + 5;

resultado := total @ 2;

mensaje := "resultado asdfg final"
print(total)
ok := total >= 0;
`,
];

function analyze() {
  const code = document.getElementById("codeInput").value;
  if (!code.trim()) return;
  const result = new Lexer(code).run();
  renderTokens(result.tokens);
  renderErrorTable(result.errTable);
  renderSymbols(result.symbols, result.tokens, result.errors);
}

function clearAll() {
  clearUI();
}

function loadSample(n) {
  document.getElementById("codeInput").value = SAMPLES[n - 1] ?? "";
}

window.analyze    = analyze;
window.clearAll   = clearAll;
window.loadSample = loadSample;

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    analyze();
  }
});