import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const mod = await import(fileURLToPath(new URL('../skills/web-design/template/src/lib/format-ko.ts', import.meta.url)));

test('Korean money, compact, date and phone formats', () => {
  assert.equal(mod.formatWon(1234567), '1,234,567원');
  assert.equal(mod.formatKrwSymbol(1234567), '₩1,234,567');
  assert.equal(mod.formatCompactKo(152000000), '1.5억');
  assert.equal(mod.formatDateKo(new Date(2026, 9, 24)), '2026. 10. 24.');
  assert.match(mod.formatDateKo(new Date(2026, 9, 24), 'long'), /^2026년 10월 24일 \(토\)$/);
  assert.equal(mod.formatTimeKo(new Date(2026, 9, 24, 14, 30)), '오후 2:30');
  assert.equal(mod.formatTimeKo(new Date(2026, 9, 24, 14, 30), false), '14:30');
  assert.equal(mod.formatPhoneKo('010 1234 5678'), '010-1234-5678');
  assert.equal(mod.formatPhoneKo('0212345678'), '02-1234-5678');
  assert.equal(mod.formatPhoneKo('+1 555'), '+1 555');
});
