/** Проверяем объединение вариантов и расчёт повторной покупки. */
import { addLine, total, payments, notifications } from "./shop";
const item = {
  id: "a",
  size: "16",
  note: "",
  qty: 1,
  name: "Кольцо",
  price: 1250,
};
it("различает размеры и пожелания, суммирует одинаковые изделия", () => {
  const cart = [item, { ...item, size: "17" }, { ...item, note: "матовое" }];
  const next = addLine(cart, item);
  expect(next.map((l) => l.qty)).toEqual([2, 1, 1]);
  expect(total(next)).toBe(5000);
  expect(total(cart)).toBe(3750);
});
it("различает результаты демооплаты и сохраняет снимок состава заказа", () => {
  expect(payments.pay("fail")).toBe(false);
  expect(payments.pay("success")).toBe(true);
  const o = {
    id: "1",
    owner: "demo",
    lines: [{ ...item }],
    name: "Анна",
    phone: "demo",
    channel: "MAX",
    note: "",
    contact: "",
    pickup: "demo",
    method: "СБП",
    status: "демо",
    sum: 1250,
  };
  const message = notifications.prepare(o);
  o.lines[0].qty = 2;
  expect(message.lines[0].qty).toBe(1);
});
