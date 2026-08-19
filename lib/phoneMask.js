// Kiritilgan raqamlarni +998 (__) ___ __ __ formatiga keltiradi
export function formatUzPhone(raw) {
  const digits = raw.replace(/\D/g, '').replace(/^998/, '').slice(0, 9);

  let out = '+998';
  if (digits.length > 0) out += ' (' + digits.slice(0, 2);
  if (digits.length >= 2) out += ')';
  if (digits.length > 2) out += ' ' + digits.slice(2, 5);
  if (digits.length > 5) out += ' ' + digits.slice(5, 7);
  if (digits.length > 7) out += ' ' + digits.slice(7, 9);
  return out;
}
