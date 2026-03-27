"use strict";

// ═══════════════════════════════════════════════════════════
// app.js  —  Punto de entrada de la aplicación
// Coordina el lexer con la UI: acciones del usuario,
// códigos de muestra y eventos del teclado.
//
// Dependencias (en orden de carga):
//   1. constants.js  — tipos, keywords, regex rules
//   2. lexer.js      — clase Lexer
//   3. render.js     — funciones de renderizado
//   4. app.js        — este archivo
// ═══════════════════════════════════════════════════════════


// ── Códigos de muestra ──────────────────────────────────────

const SAMPLES = [

  // Muestra 1: pseudocódigo con todos los tokens válidos
  `// ── Muestra 1: pseudocódigo completo ──────────────────
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

  // Muestra 2: código con los 4 tipos de error léxico
  `# ── Muestra 2: todos los tipos de error ──────────────
int total := 0
for i in [0..10]:
    total := total + i

# Error 1 — identificador demasiado largo (> 10 chars)
identificadorMuyLargoQueExcede := 50

# Error 2 — número fuera de rango (> 100)
limite := 250

# Error 3 — token inválido (número pegado a letra)
val := 123abc + 5;

# Error 4 — carácter desconocido
resultado := total @ 2;

# Tokens válidos al final
mensaje := "resultado asdfg final"
print(total)
ok := total >= 0;
`,
];


// ── Acciones principales ────────────────────────────────────

/**
 * Ejecuta el análisis léxico sobre el código ingresado
 * y actualiza toda la interfaz con los resultados.
 */
function analyze() {
  const code = document.getElementById("codeInput").value;
  if (!code.trim()) return;

  const result = new Lexer(code).run();

  renderTokens(result.tokens);
  renderErrorTable(result.errTable);
  renderSymbols(result.symbols, result.tokens, result.errors);
}

/**
 * Limpia el editor y reinicia todos los paneles de resultados.
 */
function clearAll() {
  clearUI();
}

/**
 * Carga uno de los códigos de muestra en el editor.
 * @param {number} n - número de muestra (1 o 2)
 */
function loadSample(n) {
  document.getElementById("codeInput").value = SAMPLES[n - 1] ?? "";
}


// ── Eventos ─────────────────────────────────────────────────

// Atajo de teclado: Ctrl+Enter (o Cmd+Enter en Mac) para analizar
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    analyze();
  }
});