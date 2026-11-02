/** Оформление, подтверждение и демонстрационная мастерская Елены. */
import { useRef, useState } from "react";
import type { Props } from "./Account";
import type { Details, Order, Product } from "./shop";
import {
  colors,
  delivery,
  mask,
  money,
  notifications,
  payments,
  total,
  types,
} from "./shop";
export function Receipt({ o }: { o: Order }) {
  return (
    <article className="receipt">
      <small>{o.status}</small>
      <h2>Заказ {o.id}</h2>
      {o.lines.map((l, i) => (
        <p key={i}>
          {l.name} · {l.size} {l.note} · {l.qty} шт. — {money(l.price * l.qty)}
        </p>
      ))}
      <b>
        {money(o.sum)} · {o.method}
      </b>
      <p>Демо-ПВЗ: {o.pickup}</p>
      <p>
        {o.name} · {o.phone} · {o.channel} {o.contact}
      </p>
      {o.note && <p>{o.note}</p>}
    </article>
  );
}
export function Checkout({ s, update }: Props) {
  const user = s.users.find((u) => u.phone === s.session)!,
    [phone, P] = useState(user.phone),
    [review, R] = useState<Details | null>(null),
    [error, E] = useState(""),
    lock = useRef(false);
  const lines = s.cart.map((l) => ({
    ...l,
    price: s.items.find((p) => p.id === l.id)!.price,
  }));
  if (
    !lines.length ||
    lines.some((l) => !s.items.find((p) => p.id === l.id)?.available)
  )
    return (
      <p>
        Проверьте наличие товаров в <a href="#cart">корзине</a>.
      </p>
    );
  function finish(result: string) {
    if (!review || lock.current) return;
    if (!payments.pay(result)) {
      E("Демооплата отклонена. Заказ не создан. Можно повторить попытку.");
      return;
    }
    lock.current = true;
    const o: Order = {
      ...review,
      id: crypto.randomUUID().slice(0, 8),
      owner: user.phone,
      lines,
      sum: total(lines),
      status: "Демооплата подтверждена",
    };
    update({ ...s, cart: [], orders: [notifications.prepare(o), ...s.orders] });
    location.assign("#order/" + o.id);
  }
  return (
    <section className="panel">
      <small>КОРЗИНА / ОФОРМЛЕНИЕ</small>
      <h1>{review ? "Проверьте заказ" : "Оформление"}</h1>
      <form
        hidden={!!review}
        onSubmit={(e) => {
          e.preventDefault();
          R(Object.fromEntries(new FormData(e.currentTarget)) as Details);
        }}
      >
        <label>
          Получатель
          <input name="name" required defaultValue={user.name} />
        </label>
        <label>
          Телефон
          <input
            name="phone"
            value={phone}
            minLength={18}
            required
            onChange={(e) => P(mask(e.target.value))}
          />
        </label>
        <label>
          Как связаться
          <select name="channel">
            {["Звонок", "ВКонтакте", "Telegram", "Instagram", "MAX"].map(
              option,
            )}
          </select>
        </label>
        <label>
          Дополнительный контакт
          <input name="contact" />
        </label>
        <label>
          Комментарий
          <textarea name="note" />
        </label>
        <label>
          Тестовый пункт выдачи
          <select name="pickup" required defaultValue="">
            <option value="" disabled>
              Выберите адрес
            </option>
            {delivery.points().map(option)}
          </select>
        </label>
        <label>
          Демооплата
          <select name="method">{["Карта", "СБП"].map(option)}</select>
        </label>
        <button>Проверить заказ</button>
      </form>
      {review && (
        <>
          <Receipt
            o={{
              ...review,
              owner: user.phone,
              id: "к подтверждению",
              sum: total(lines),
              lines,
              status: "Демонстрация · деньги не списываются",
            }}
          />
          <button onClick={() => finish("success")}>
            Подтвердить демооплату
          </button>{" "}
          <button className="quiet" onClick={() => finish("fail")}>
            Проверить отказ
          </button>{" "}
          <button
            className="quiet"
            onClick={() => {
              R(null);
              E("");
            }}
          >
            Изменить
          </button>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}
const option = (x: string) => <option key={x}>{x}</option>;
export function Admin({ s, update }: Props) {
  const [id, S] = useState(""),
    [notice, N] = useState("");
  const p = s.items.find((p) => p.id === id);
  function submit(form: HTMLFormElement) {
    const f = new FormData(form),
      v = (k: string) => String(f.get(k) || "").trim();
    const item: Product = {
      id: id || crypto.randomUUID(),
      name: v("name"),
      type: v("type"),
      color: v("color"),
      photo: v("photo"),
      description: v("description"),
      material: v("material"),
      sizes: v("sizes")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      price: Number(v("price")),
      available: f.has("available"),
    };
    update({
      ...s,
      items: p
        ? s.items.map((x) => (x.id === id ? item : x))
        : [...s.items, item],
    });
    S(item.id);
    N("Карточка сохранена");
  }
  return (
    <>
      <h1>Мастерская Елены</h1>
      <p>
        Открытый деморежим. Изменения и тестовые заказы видны только в этом
        браузере.
      </p>
      <label>
        Карточка
        <select
          value={id}
          onChange={(e) => {
            S(e.target.value);
            N("");
          }}
        >
          <option value="">Новое изделие</option>
          {s.items.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <form
        className="panel"
        key={id}
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        {[
          ["name", "Название", p?.name],
          ["material", "Материал", p?.material],
          ["description", "Описание", p?.description],
          ["sizes", "Размеры через запятую", p?.sizes.join(", ")],
          ["photo", "URL фотографии", p?.photo],
        ].map(([key, label, value]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              defaultValue={value}
              required={!["photo", "sizes"].includes(key!)}
              type={key === "photo" ? "url" : "text"}
            />
          </label>
        ))}
        <label>
          Тип
          <select name="type" defaultValue={p?.type}>
            {types.map(option)}
          </select>
        </label>
        <label>
          Цвет
          <select name="color" defaultValue={p?.color}>
            {colors.map(option)}
          </select>
        </label>
        <label>
          Цена, ₽
          <input
            name="price"
            type="number"
            min="1"
            required
            defaultValue={p?.price}
          />
        </label>
        <label>
          <input
            type="checkbox"
            name="available"
            defaultChecked={p?.available ?? true}
          />{" "}
          В наличии
        </label>
        <button>Сохранить изделие</button>
        {notice}
      </form>
      <h2>Заказы · журнал демоуведомлений ВКонтакте</h2>
      {s.orders.length ? (
        s.orders.map((o) => <Receipt key={o.id} o={o} />)
      ) : (
        <p>Заказов пока нет.</p>
      )}
    </>
  );
}
