"use strict";

const $ = id => document.getElementById(id);

const esc = str =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function emptyState(icon, message) {
  return `<div class="empty"><span class="empty-icon">${icon}</span><span>${message}</span></div>`;
}

function pillClass(type) {
  const map = {
    [TYPE.KW]:     "pill-kw",
    [TYPE.ID]:     "pill-id",
    [TYPE.NUM]:    "pill-num",
    [TYPE.STR]:    "pill-str",
    [TYPE.ARITH]:  "pill-arith",
    [TYPE.ASSIGN]: "pill-assign",
    [TYPE.REL]:    "pill-rel",
    [TYPE.ERR]:    "pill-err",
  };
  return map[type] ?? "pill-id";
}

function tdClass(type) {
  const map = {
    [TYPE.KW]:     "td-kw",
    [TYPE.ID]:     "td-id",
    [TYPE.NUM]:    "td-num",
    [TYPE.STR]:    "td-str",
    [TYPE.ARITH]:  "td-arith",
    [TYPE.ASSIGN]: "td-arith",
    [TYPE.REL]:    "td-rel",
    [TYPE.ERR]:    "td-err",
  };
  return map[type] ?? "";
}

function renderTokens(tokens) {
  const grid       = $("tokensGrid");
  const countBadge = $("tokCount");
  countBadge.textContent = tokens.length ? `${tokens.length} tokens` : "";
  if (!tokens.length) {
    grid.innerHTML = emptyState("◎", "Sin tokens detectados");
    return;
  }
  const rows = tokens.map((token, index) => {
    const animDelay = Math.min(index * 10, 600);
    const errorRow  = token.extra
      ? `<div class="tok-err-msg">⚠ ${esc(token.extra)}</div>`
      : "";
    return `
      <div class="tok-card" style="animation-delay:${animDelay}ms">
        <span class="tok-index">${token.id}</span>
        <span class="tok-pill ${pillClass(token.type)}">${esc(token.type)}</span>
        <span class="tok-value" title="${esc(token.value)}">${esc(token.value)}</span>
        <span class="tok-line">L${token.line}</span>
        ${errorRow}
      </div>`;
  });
  grid.innerHTML = rows.join("");
}

function renderErrorTable(errTable) {
  const wrap       = $("errWrap");
  const countBadge = $("errCount");
  countBadge.textContent = errTable.length ? `${errTable.length} errores` : "";
  if (!errTable.length) {
    wrap.innerHTML = `<div class="err-ok"><span>✓</span> Sin errores léxicos detectados</div>`;
    return;
  }
  const rows = errTable.map(err => `
    <tr>
      <td>${err.id}</td>
      <td class="td-err" style="font-weight:500">${esc(err.lexema)}</td>
      <td><span class="err-type-badge" style="color:${ERR_COLOR[err.errType] ?? "var(--coral)"}">
        ${esc(err.errType)}</span></td>
      <td style="color:var(--tx-soft);font-size:.75rem">${esc(err.detail)}</td>
      <td style="color:var(--tx-muted)">Línea ${err.line}, Col ${err.col}</td>
    </tr>`);
  wrap.innerHTML = `
    <div class="sym-wrap">
      <table class="sym-table">
        <thead><tr><th>#</th><th>Lexema</th><th>Tipo de error</th><th>Descripción</th><th>Posición</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}

function renderSymbols(symbols, tokens, errors) {
  const wrap       = $("symWrap");
  const countBadge = $("symCount");
  const statsWrap  = $("statsWrap");
  countBadge.textContent = symbols.length ? `${symbols.length} entradas` : "";
  if (!symbols.length) {
    wrap.innerHTML      = emptyState("⊡", "La tabla se generará al analizar...");
    statsWrap.innerHTML = "";
    return;
  }
  _renderStats(tokens, errors, statsWrap);
  _renderSymbolsTable(symbols, wrap);
}

function _renderStats(tokens, errors, container) {
  const count = type => tokens.filter(t => t.type === type).length;
  const stats = [
    { val: tokens.length,                                             lbl: "Total",      cls: "stat-total", color: "var(--indigo)"  },
    { val: count(TYPE.KW),                                            lbl: "Reservadas", cls: "stat-kw",    color: "var(--t-kw)"    },
    { val: count(TYPE.ID),                                            lbl: "Identif.",   cls: "stat-id",    color: "var(--t-id)"    },
    { val: count(TYPE.NUM),                                           lbl: "Números",    cls: "stat-num",   color: "var(--t-num)"   },
    { val: count(TYPE.STR),                                           lbl: "Cadenas",    cls: "stat-str",   color: "var(--t-str)"   },
    { val: count(TYPE.ARITH) + count(TYPE.ASSIGN) + count(TYPE.REL), lbl: "Operadores", cls: "stat-ops",   color: "var(--t-arith)" },
    { val: errors.length,                                             lbl: "Errores",    cls: "stat-err",   color: "var(--t-err)"   },
  ];
  const chips = stats.map(s => `
    <div class="stat-card ${s.cls}">
      <div class="stat-n" style="color:${s.color}">${s.val}</div>
      <div class="stat-lbl">${s.lbl}</div>
    </div>`);
  container.innerHTML = `<div class="stats-row">${chips.join("")}</div>`;
}

function _renderSymbolsTable(symbols, container) {
  const rows = symbols
    .sort((a, b) => a.id - b.id)
    .map(sym => `
      <tr>
        <td>${sym.id}</td>
        <td class="${tdClass(sym.type)}">${esc(sym.name)}</td>
        <td><span class="tok-pill ${pillClass(sym.type)}">${esc(sym.type)}</span></td>
        <td style="color:var(--tx-soft)">${esc(sym.category)}</td>
        <td style="color:var(--tx-soft)">${sym.line}</td>
        <td><span class="occ">${sym.occ}</span></td>
      </tr>`);
  container.innerHTML = `
    <div class="sym-wrap">
      <table class="sym-table">
        <thead><tr><th>#</th><th>Lexema</th><th>Tipo de token</th><th>Categoría</th><th>1ª línea</th><th>Ocurrencias</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}

function clearUI() {
  $("codeInput").value        = "";
  $("tokensGrid").innerHTML   = emptyState("◎", "Esperando código fuente...");
  $("errWrap").innerHTML      = emptyState("⚠", "Los errores aparecerán aquí...");
  $("symWrap").innerHTML      = emptyState("⊡", "La tabla se generará al analizar...");
  $("statsWrap").innerHTML    = "";
  $("tokCount").textContent   = "";
  $("errCount").textContent   = "";
  $("symCount").textContent   = "";
}