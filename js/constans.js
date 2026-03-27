"use strict";

// ═══════════════════════════════════════════════════════════
// constants.js
// Define todas las constantes del analizador léxico:
// tipos de token, categorías, tipos de error, palabras
// reservadas y las expresiones regulares de cada token.
// ═══════════════════════════════════════════════════════════


// ── Tipos de token ──────────────────────────────────────────
const TYPE = {
  KW:     "Palabra reservada",
  ID:     "Identificador",
  NUM:    "Número entero",
  STR:    "Cadena asdfg",
  ARITH:  "Operador aritmético",
  ASSIGN: "Operador de asignación",
  REL:    "Operador relacional",
  ERR:    "Error",
};


// ── Categorías para la tabla de símbolos ────────────────────
const CAT = {
  [TYPE.KW]:     "Reservada",
  [TYPE.ID]:     "Identificador",
  [TYPE.NUM]:    "Constante",
  [TYPE.STR]:    "Cadena",
  [TYPE.ARITH]:  "Operador",
  [TYPE.ASSIGN]: "Operador",
  [TYPE.REL]:    "Símbolo/Relacional",
  [TYPE.ERR]:    "Error",
};


// ── Tipos de error léxico clasificados ──────────────────────
const ERR_TYPES = {
  ID_TOO_LONG:   "Identificador muy largo",
  NUM_OUT_RANGE: "Número fuera de rango",
  INVALID_TOKEN: "Token inválido",
  UNKNOWN_CHAR:  "Carácter desconocido",
};


// ── Color por tipo de error (para la tabla de errores) ──────
const ERR_COLOR = {
  [ERR_TYPES.ID_TOO_LONG]:   "var(--violet)",
  [ERR_TYPES.NUM_OUT_RANGE]: "var(--amber)",
  [ERR_TYPES.INVALID_TOKEN]: "var(--fuchsia)",
  [ERR_TYPES.UNKNOWN_CHAR]:  "var(--coral)",
};


// ── Palabras reservadas ─────────────────────────────────────
// Incluye las base + todas las combinaciones con "asdfg"
// + palabras comunes de lenguajes de alto nivel

const BASE_KW = new Set(["if", "else", "for", "print", "int"]);

function buildKeywords() {
  const kw = new Set([...BASE_KW, "asdfg"]);

  // Combinaciones con asdfg
  for (const w of BASE_KW) {
    kw.add(w + "asdfg");
    kw.add("asdfg" + w);
    kw.add(w + "asdfg" + w);
  }

  // Palabras de lenguajes de alto nivel reconocidas
  [
    "while", "do", "return", "void", "bool", "true", "false",
    "break", "continue", "function", "var", "let", "const",
    "class", "import", "export", "new", "this", "null", "undefined",
  ].forEach(w => kw.add(w));

  return kw;
}

const KEYWORDS = buildKeywords();


// ── Expresiones regulares — motor del analizador ────────────
// IMPORTANTE: el orden de evaluación importa.
// Se evalúan de arriba hacia abajo; la primera que coincida gana.

const REGEX_RULES = [
  // ── Comentarios y espacios (se omiten, no generan token) ──
  { regex: /^\/\/[^\n]*/,                    type: "SKIP"      },  // comentario //
  { regex: /^\/\*[\s\S]*?\*\//,              type: "SKIP"      },  // comentario /* ... */
  { regex: /^#[^\n]*/,                       type: "SKIP"      },  // comentario # (Python/Ruby)
  { regex: /^--[^\n]*/,                      type: "SKIP"      },  // comentario -- (SQL/Lua)
  { regex: /^[ \t\r\n]+/,                    type: "SKIP"      },  // espacios en blanco

  // ── Cadenas de caracteres ──────────────────────────────────
  { regex: /^"([^"\n]*)"/,                   type: "STR"       },  // cadena con comillas dobles
  { regex: /^'([^'\n]*)'/,                   type: "STR"       },  // cadena con comillas simples

  // ── Operador de asignación (debe ir antes que relacionales) ─
  { regex: /^:=/,                            type: "ASSIGN"    },  // operador :=

  // ── Operadores relacionales de 2 caracteres ────────────────
  { regex: /^(>=|<=|<>|\.\.)/,               type: "REL"       },  // >=  <=  <>  ..

  // ── Operadores aritméticos ─────────────────────────────────
  { regex: /^[+\-*\/]/,                      type: "ARITH"     },  // + - * /

  // ── Operadores relacionales de 1 carácter + símbolos ───────
  { regex: /^[><={}[\](),;.]/,               type: "REL"       },  // > < = { } [ ] ( ) , ; .

  // ── Errores numéricos: número pegado a letras (ej: 123abc) ──
  { regex: /^[0-9]+[a-zA-Z_][a-zA-Z0-9_]*/, type: "ERR_TOKEN" },

  // ── Número entero ──────────────────────────────────────────
  { regex: /^[0-9]+/,                        type: "NUM_RAW"   },

  // ── Palabra: identificador o palabra reservada ─────────────
  { regex: /^[a-zA-Z_][a-zA-Z0-9_]*/,       type: "WORD"      },

  // ── Carácter desconocido (lo que no coincidió con nada) ─────
  { regex: /^./,                             type: "ERR_CHAR"  },
];