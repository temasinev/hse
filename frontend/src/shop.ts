/** Модели витрины, локальный каталог и заменяемые демосервисы. */
export const types = ["Колье", "Серьги", "Браслеты", "Кольца", "Чокеры"];
export const colors = ["Гранатовый", "Жемчужный", "Оливковый", "Янтарный"];
export type Product = {
  id: string;
  name: string;
  type: string;
  color: string;
  material: string;
  price: number;
  available: boolean;
  description: string;
  sizes: string[];
  photo: string;
};
const names = [
  "Спелая ягода",
  "Лунная роса",
  "Лист шалфея",
  "Тёплый мёд",
  "Сумерки",
  "Перламутр",
  "Лесная тропа",
  "Облепиха",
  "Черешня",
  "Белая ночь",
  "Молодой лист",
  "Золотой час",
  "Клюква",
  "Тихая вода",
  "Полынь",
];
const materials = [
  "стеклянные бусины",
  "искусственный жемчуг",
  "тонированное стекло",
  "янтарное стекло",
];
export const catalog: Product[] = names.map((name, i) => {
  const type = types[i % 5],
    color = colors[i % 4],
    material = materials[i % 4];
  return {
    id: "s" + (i + 1),
    name,
    type,
    color,
    material,
    price: 1200 + ((i * 350) % 2300),
    available: i !== 13,
    description: [
      "Мягкая дуга бусин подчёркивает линию ключиц.",
      "Две лёгкие подвески подвижно ловят свет.",
      "Ритм небольших бусин красиво смотрится рядом с часами.",
      "Гладкий ободок с цветным акцентом удобно сочетать с тонкими кольцами.",
      "Короткая нить с аккуратным центром ложится у основания шеи.",
    ][i % 5],
    sizes: [
      ["40 см", "45 см"],
      [],
      ["16 см", "18 см"],
      ["16", "17", "18"],
      ["34 см", "36 см"],
    ][i % 5],
    photo: "",
  };
});
export type Line = {
  id: string;
  size: string;
  note: string;
  qty: number;
  price: number;
  name: string;
};
export const total = (lines: Line[]) =>
  lines.reduce((sum, l) => sum + l.price * l.qty, 0);
export function addLine(lines: Line[], item: Line) {
  const index = lines.findIndex(
    (l) => l.id === item.id && l.size === item.size && l.note === item.note,
  );
  return index < 0
    ? [...lines, item]
    : lines.map((l, i) => (i === index ? { ...l, qty: l.qty + 1 } : l));
}
export type User = {
  phone: string;
  name: string;
  email: string;
  birth: string;
  photo: string;
};
export type Details = {
  name: string;
  phone: string;
  contact: string;
  channel: string;
  note: string;
  pickup: string;
  method: string;
};
export type Order = Details & {
  id: string;
  owner: string;
  lines: Line[];
  sum: number;
  status: string;
};
export interface Sms {
  issue(): string;
}
export interface Payments {
  pay(result: string): boolean;
}
export interface Delivery {
  points(): string[];
}
export interface Notifications {
  prepare(order: Order): Order;
}
export const sms: Sms = {
  issue: () =>
    String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)),
};
export const payments: Payments = { pay: (r) => r === "success" };
export const delivery: Delivery = {
  points: () => [
    "Ягодный · Учебная ул., 1",
    "Садовый · Демо-переулок, 5",
    "Лесной · Тестовая площадь, 2",
  ],
};
export const notifications: Notifications = {
  prepare: (o) => ({ ...o, lines: o.lines.map((l) => ({ ...l })) }),
};
export type State = {
  items: Product[];
  cart: Line[];
  users: User[];
  session: string;
  orders: Order[];
};
const key = "smorodina.demo.v1";
export function read(): State {
  const raw = localStorage.getItem(key);
  if (!raw)
    return { items: catalog, cart: [], users: [], session: "", orders: [] };
  const s: State = JSON.parse(raw);
  return {
    ...s,
    session: s.session && mask(s.session),
    users: s.users.map((u) => ({ ...u, phone: mask(u.phone) })),
    orders: s.orders.map((o) => ({
      ...o,
      owner: mask(o.owner),
      phone: mask(o.phone),
    })),
  };
}
export function save(state: State) {
  localStorage.setItem(key, JSON.stringify(state));
}
export const money = (n: number) => n.toLocaleString("ru-RU") + " ₽";
export function mask(value: string) {
  let d = value.replace(/\D/g, "");
  if (value.startsWith("+7") || (d.length === 11 && /^[78]/.test(d)))
    d = d.slice(1);
  d = d.slice(0, 10);
  return (
    "+7" +
    (d ? "(" + d.slice(0, 3) : "") +
    (d.length > 3 ? ")-" : "") +
    d.slice(3, 6) +
    (d.length > 6 ? "-" + d.slice(6, 8) : "") +
    (d.length > 8 ? "-" + d.slice(8) : "")
  );
}
export const completePhone = (value: string) =>
  /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/.test(value);
