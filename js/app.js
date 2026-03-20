"use strict";

// ═══════════════════════════════════════════════════════════
// LEXER  —  motor de análisis léxico
// ═══════════════════════════════════════════════════════════

const BASE_KW = new Set(["if","else","for","print","int"]);

function buildKeywords() {
  const kw = new Set([...BASE_KW, "asdfg"]);
  for (const w of BASE_KW) {
    kw.add(w + "asdfg");
    kw.add("asdfg" + w);
    kw.add(w + "asdfg" + w);
  }
  // palabras comunes de lenguajes de alto nivel también reconocidas
  ["while","do","return","void","bool","true","false",
   "break","continue","function","var","let","const",
   "class","import","export","new","this","null","undefined"].forEach(w => kw.add(w));
  return kw;
}

const KEYWORDS  = buildKeywords();
const ARITH     = new Set(["+","-","*","/"]);
const REL2      = new Set([">=","<=","<>",":=",".."]);
const REL1      = new Set([">","<","=","{","}","[","]","(",")",",",";","."]);

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

class Lexer {
  constructor(src) {
    this.src   = src;
    this.pos   = 0;
    this.line  = 1;
    this.col   = 1;
    this.toks  = [];
    this.sym   = {};
    this.errs  = [];
    this._tid  = 0;
    this._sid  = 0;
  }

  ch(o=0)  { return this.src[this.pos+o] ?? ""; }
  letter(c){ return /[a-zA-Z_]/.test(c); }
  digit(c) { return /[0-9]/.test(c); }
  alnum(c) { return /[a-zA-Z0-9_]/.test(c); }

  next() {
    const c = this.src[this.pos++];
    if (c==="\n"){ this.line++; this.col=1; } else { this.col++; }
    return c;
  }

  emit(typeKey, value, extra="") {
    this._tid++;
    const tok = { id:this._tid, type:TYPE[typeKey], value, line:this.line, col:this.col, extra };
    this.toks.push(tok);
    // tabla de símbolos
    const key = `${tok.type}|${tok.value}`;
    if (!this.sym[key]) {
      this._sid++;
      this.sym[key] = {
        id: this._sid, name: tok.value, type: tok.type,
        category: CAT[TYPE[typeKey]] ?? TYPE[typeKey],
        line: tok.line, occ: 1,
      };
    } else {
      this.sym[key].occ++;
    }
    return tok;
  }

  skip() {
    while (this.pos < this.src.length) {
      const c = this.ch();
      if (" \t\r\n".includes(c))           { this.next(); continue; }
      if (c==="/" && this.ch(1)==="/")      { while(this.pos<this.src.length && this.ch()!=="\n") this.next(); continue; }
      if (c==="/" && this.ch(1)==="*")      {
        this.next(); this.next();
        while(this.pos<this.src.length){ if(this.ch()==="*"&&this.ch(1)==="/"){this.next();this.next();break;} this.next(); }
        continue;
      }
      if (c==="#")                          { while(this.pos<this.src.length && this.ch()!=="\n") this.next(); continue; }
      if (c==="-" && this.ch(1)==="-")      { while(this.pos<this.src.length && this.ch()!=="\n") this.next(); continue; }
      break;
    }
  }

  word() {
    let w="";
    while(this.pos<this.src.length && this.alnum(this.ch())) w+=this.next();
    return w;
  }

  run() {
    while (this.pos < this.src.length) {
      this.skip();
      if (this.pos >= this.src.length) break;
      const c = this.ch(), ln = this.line;

      /* ── palabras ─────────────────────────── */
      if (this.letter(c)) {
        const w = this.word();
        if (KEYWORDS.has(w.toLowerCase()))  this.emit("KW", w);
        else if (w.length > 10) {
          this.emit("ERR", w, `Identificador de ${w.length} chars (máx. 10)`);
          this.errs.push(`Línea ${ln}: "${w}" excede 10 caracteres (tiene ${w.length}).`);
        } else {
          this.emit("ID", w);
        }
        continue;
      }

      /* ── números ──────────────────────────── */
      if (this.digit(c)) {
        let n="";
        while(this.pos<this.src.length && this.digit(this.ch())) n+=this.next();
        if (this.pos<this.src.length && this.letter(this.ch())) {
          let bad=n; while(this.pos<this.src.length && this.alnum(this.ch())) bad+=this.next();
          this.emit("ERR", bad, `Token inválido: "${bad}"`);
          this.errs.push(`Línea ${ln}: token inválido "${bad}".`);
        } else {
          const v=parseInt(n,10);
          if(v>=0 && v<=100) this.emit("NUM", n);
          else {
            this.emit("ERR", n, `Número fuera de rango 0-100 (valor: ${v})`);
            this.errs.push(`Línea ${ln}: número ${n} fuera del rango 0–100.`);
          }
        }
        continue;
      }

      /* ── cadenas ──────────────────────────── */
      if (c==='"' || c==="'") {
        const q=this.next(); let s="";
        while(this.pos<this.src.length && this.ch()!==q && this.ch()!=="\n") s+=this.next();
        if(this.ch()===q) this.next();
        this.emit("STR", s);
        continue;
      }

      /* ── 2-char ops ───────────────────────── */
      const two = c+this.ch(1);
      if (two===":=")          { this.next();this.next(); this.emit("ASSIGN",":="); continue; }
      if (REL2.has(two))       { this.next();this.next(); this.emit("REL",two);     continue; }

      /* ── arith ────────────────────────────── */
      if (ARITH.has(c))        { this.next(); this.emit("ARITH",c);  continue; }

      /* ── rel 1-char ───────────────────────── */
      if (REL1.has(c))         { this.next(); this.emit("REL",c);    continue; }

      /* ── punto ────────────────────────────── */
      if (c===".") {
        if(this.ch(1)===".") { this.next();this.next(); this.emit("REL",".."); }
        else                  { this.next();             this.emit("REL",".");  }
        continue;
      }

      /* ── desconocido ──────────────────────── */
      const u=this.next();
      this.emit("ERR",u,`Carácter no reconocido: '${u}'`);
      this.errs.push(`Línea ${ln}: carácter desconocido '${u}'.`);
    }
    return { tokens: this.toks, symbols: Object.values(this.sym), errors: this.errs };
  }
}

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

// ═══════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function pillClass(type) {
  const m = {
    [TYPE.KW]:"pill-kw", [TYPE.ID]:"pill-id", [TYPE.NUM]:"pill-num",
    [TYPE.STR]:"pill-str", [TYPE.ARITH]:"pill-arith", [TYPE.ASSIGN]:"pill-assign",
    [TYPE.REL]:"pill-rel", [TYPE.ERR]:"pill-err",
  };
  return m[type] ?? "pill-id";
}

function tdClass(type) {
  const m = {
    [TYPE.KW]:"td-kw", [TYPE.ID]:"td-id", [TYPE.NUM]:"td-num",
    [TYPE.STR]:"td-str", [TYPE.ARITH]:"td-arith", [TYPE.ASSIGN]:"td-arith",
    [TYPE.REL]:"td-rel", [TYPE.ERR]:"td-err",
  };
  return m[type] ?? "";
}

function empty(icon, msg) {
  return `<div class="empty"><span class="empty-icon">${icon}</span><span>${msg}</span></div>`;
}

// ═══════════════════════════════════════════════════════════
// RENDER TOKENS
// ═══════════════════════════════════════════════════════════

function renderTokens(tokens, errors) {
  const grid = $("tokensGrid");
  const cnt  = $("tokCount");

  cnt.textContent = tokens.length ? `${tokens.length} tokens` : "";

  if (!tokens.length) { grid.innerHTML = empty("◎", "Sin tokens detectados"); return; }

  let html = "";
  tokens.forEach((t, i) => {
    const delay = Math.min(i * 10, 600);
    const errRow = t.extra
      ? `<div class="tok-err-msg">⚠ ${esc(t.extra)}</div>`
      : "";
    html += `
      <div class="tok-card" style="animation-delay:${delay}ms">
        <span class="tok-index">${t.id}</span>
        <span class="tok-pill ${pillClass(t.type)}">${esc(t.type)}</span>
        <span class="tok-value" title="${esc(t.value)}">${esc(t.value)}</span>
        <span class="tok-line">L${t.line}</span>
        ${errRow}
      </div>`;
  });

  if (errors.length) {
    html += `<div class="err-list" style="grid-column:1/-1">`;
    errors.forEach(e => {
      html += `<div class="err-item"><span class="err-icon">⚠</span><span>${esc(e)}</span></div>`;
    });
    html += `</div>`;
  }

  grid.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// RENDER SYMBOL TABLE
// ═══════════════════════════════════════════════════════════

function renderSymbols(symbols, tokens, errors) {
  const wrap = $("symWrap");
  const cnt  = $("symCount");
  const stat = $("statsWrap");

  cnt.textContent = symbols.length ? `${symbols.length} entradas` : "";

  if (!symbols.length) {
    wrap.innerHTML = empty("⊡", "La tabla se generará al analizar...");
    stat.innerHTML = "";
    return;
  }

  // Estadísticas
  const n = (t) => tokens.filter(tk => tk.type === t).length;
  const total  = tokens.length;
  const kwN    = n(TYPE.KW);
  const idN    = n(TYPE.ID);
  const numN   = n(TYPE.NUM);
  const strN   = n(TYPE.STR);
  const opN    = n(TYPE.ARITH) + n(TYPE.ASSIGN) + n(TYPE.REL);
  const errN   = errors.length;

  stat.innerHTML = `
    <div class="stats-row">
      ${sc(total, "Total",       "stat-total", "var(--indigo)")}
      ${sc(kwN,   "Reservadas",  "stat-kw",    "var(--t-kw)")}
      ${sc(idN,   "Identif.",    "stat-id",    "var(--t-id)")}
      ${sc(numN,  "Números",     "stat-num",   "var(--t-num)")}
      ${sc(strN,  "Cadenas",     "stat-str",   "var(--t-str)")}
      ${sc(opN,   "Operadores",  "stat-ops",   "var(--t-arith)")}
      ${sc(errN,  "Errores",     "stat-err",   "var(--t-err)")}
    </div>`;

  const rows = symbols.sort((a,b)=>a.id-b.id).map(s => `
    <tr>
      <td>${s.id}</td>
      <td class="${tdClass(s.type)}">${esc(s.name)}</td>
      <td><span class="tok-pill ${pillClass(s.type)}">${esc(s.type)}</span></td>
      <td style="color:var(--tx-soft)">${esc(s.category)}</td>
      <td style="color:var(--tx-soft)">${s.line}</td>
      <td><span class="occ">${s.occ}</span></td>
    </tr>`).join("");

  wrap.innerHTML = `
    <div class="sym-wrap">
      <table class="sym-table">
        <thead>
          <tr>
            <th>#</th><th>Lexema</th><th>Tipo de token</th>
            <th>Categoría</th><th>1ª línea</th><th>Ocurrencias</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function sc(val, lbl, cls, color) {
  return `
    <div class="stat-card ${cls}">
      <div class="stat-n" style="color:${color}">${val}</div>
      <div class="stat-lbl">${lbl}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// ACCIONES
// ═══════════════════════════════════════════════════════════

function analyze() {
  const code = $("codeInput").value;
  if (!code.trim()) return;

  const result = new Lexer(code).run();
  renderTokens(result.tokens, result.errors);
  renderSymbols(result.symbols, result.tokens, result.errors);
}

function clearAll() {
  $("codeInput").value = "";
  $("tokensGrid").innerHTML = empty("◎", "Esperando código fuente...");
  $("symWrap").innerHTML    = empty("⊡", "La tabla se generará al analizar...");
  $("statsWrap").innerHTML  = "";
  $("tokCount").textContent = "";
  $("symCount").textContent = "";
}

// ── Muestras ─────────────────────────────────────────────

const SAMPLES = [`// ── Muestra 1: pseudocódigo completo ──────────────────
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
`# ── Muestra 2: Python-like con errores léxicos ──────
int total := 0
for contador in [0..10]:
    if contador >= 5:
        total := total + contador * 2
    else:
        total := total - 1

# Identificador demasiado largo (error léxico)
identificadorMuyLargoQueExcede := 50

# Número fuera de rango (error léxico)
limite := 150

# Cadena con asdfg (válida)
mensaje := "resultado asdfg final"
print(total)

# Operadores varios
ok := (total >= 0) <> false;
rng := arr[1..5];
`];

function loadSample(n) {
  $("codeInput").value = SAMPLES[n-1] ?? "";
}

// ── Atajo Ctrl+Enter ──────────────────────────────────
document.addEventListener("keydown", e => {
  if ((e.ctrlKey||e.metaKey) && e.key==="Enter") analyze();
});
