"use strict";

const TYPE = {
  KW:     "Palabra reservada",
  ID:     "Identificador",
  NUM:    "Número entero",
  STR:    "Cadena",
  ARITH:  "Operador aritmético",
  ASSIGN: "Operador de asignación",
  REL:    "Operador relacional",
  ERR:    "Error",
};

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

const ERR_TYPES = {
  ID_TOO_LONG:   "Identificador muy largo",
  NUM_OUT_RANGE: "Número fuera de rango",
  INVALID_TOKEN: "Token inválido",
  UNKNOWN_CHAR:  "Carácter desconocido",
};

const ERR_COLOR = {
  [ERR_TYPES.ID_TOO_LONG]:   "var(--violet)",
  [ERR_TYPES.NUM_OUT_RANGE]: "var(--amber)",
  [ERR_TYPES.INVALID_TOKEN]: "var(--fuchsia)",
  [ERR_TYPES.UNKNOWN_CHAR]:  "var(--coral)",
};

const BASE_KW = new Set(["if", "else", "for", "print", "int"]);

function buildKeywords() {
  const kw = new Set([...BASE_KW, "asdfg"]);
  for (const w of BASE_KW) {
    kw.add(w + "asdfg");
    kw.add("asdfg" + w);
    kw.add(w + "asdfg" + w);
  }
  [
    "while", "do", "return", "void", "bool", "true", "false",
    "break", "continue", "function", "var", "let", "const",
    "class", "import", "export", "new", "this", "null", "undefined",
  ].forEach(w => kw.add(w));
  return kw;
}

const KEYWORDS = buildKeywords();

const REGEX_RULES = [
  { regex: /^\/\/[^\n]*/,                    type: "SKIP"      },
  { regex: /^\/\*[\s\S]*?\*\//,              type: "SKIP"      },
  { regex: /^#[^\n]*/,                       type: "SKIP"      },
  { regex: /^--[^\n]*/,                      type: "SKIP"      },
  { regex: /^[ \t\r\n]+/,                    type: "SKIP"      },
  { regex: /^"([^"\n]*)"/,                   type: "STR"       },
  { regex: /^'([^'\n]*)'/,                   type: "STR"       },
  { regex: /^:=/,                            type: "ASSIGN"    },
  { regex: /^(>=|<=|<>|\.\.)/,               type: "REL"       },
  { regex: /^[+\-*\/]/,                      type: "ARITH"     },
  { regex: /^[><={}[\](),;.]/,               type: "REL"       },
  { regex: /^[0-9]+[a-zA-Z_][a-zA-Z0-9_]*/, type: "ERR_TOKEN" },
  { regex: /^[0-9]+/,                        type: "NUM_RAW"   },
  { regex: /^[a-zA-Z_][a-zA-Z0-9_]*/,       type: "WORD"      },
  { regex: /^./,                             type: "ERR_CHAR"  },
];