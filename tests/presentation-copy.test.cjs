const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const presentation = readFileSync('match-web/src/app/apresentacao/page.tsx', 'utf8');
const exhibitorPortal = readFileSync('match-web/src/app/portal/expositor/page.tsx', 'utf8');

test('every presentation navigation anchor has a matching section id', () => {
  const anchors = [...presentation.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  for (const anchor of anchors) {
    assert.match(presentation, new RegExp(`id=["']${anchor}["']`), anchor);
  }
});

test('illustrative numbers are explicitly identified and mock export is not a button', () => {
  assert.match(presentation, /Dados ilustrativos/);
  assert.doesNotMatch(presentation, /<button[^>]*>[\s\S]{0,200}Exportar CSV/);
});

test('presentation and portal no longer repeat known misleading labels', () => {
  assert.doesNotMatch(presentation, /Simpla/);
  assert.doesNotMatch(presentation, /Materiais dos Palestrantes/);
  assert.doesNotMatch(exhibitorPortal, /Nenhum visitante escaneou seu estande/);
  assert.match(exhibitorPortal, /representante autorizado escaneia o crachá/);
});
