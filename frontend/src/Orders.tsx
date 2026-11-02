/** Оформление, подтверждение и демонстрационная мастерская Елены. */
import { useRef, useState } from "react";
import type { Props } from "./Account";
import { PhoneField } from "./PhoneField";
import type { Details, Order, Product } from "./shop";
import {
  colors,
  delivery,
  completePhone,
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
    [step, setStep] = useState(0),
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
      <h1>
        {review
          ? "Проверьте заказ"
          : ["Получатель", "Пункт выдачи", "Способ оплаты"][step]}
      </h1>
      <p>
        Шаг {review ? 4 : step + 1} из 4 · Контакты → Доставка → Оплата →
        Проверка
      </p>
      <form
        hidden={!!review}
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) {
            setStep(step + 1);
            return;
          }
          R(Object.fromEntries(new FormData(e.currentTarget)) as Details);
        }}
      >
        <div hidden={step !== 0}>
          <label>
            Получатель
            <input
              name="name"
              required
              pattern=".*\S.*"
              defaultValue={user.name}
            />
          </label>
          <PhoneField value={phone} onChange={P} />
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
        </div>
        <div hidden={step !== 1}>
          <p>
            Выберите удобный адрес. Все пункты ниже вымышлены для демонстрации.
          </p>
          <label>
            Тестовый пункт выдачи
            <select name="pickup" required={step === 1} defaultValue="">
              <option value="" disabled>
                Выберите адрес
              </option>
              {delivery.points().map(option)}
            </select>
          </label>
        </div>
        <div hidden={step !== 2}>
          <p>Карта или СБП. Реального списания в демоверсии нет.</p>
          <label>
            Демооплата
            <select name="method">{["Карта", "СБП"].map(option)}</select>
          </label>
        </div>
        {step > 0 && (
          <button
            className="quiet"
            type="button"
            onClick={() => setStep(step - 1)}
          >
            Назад
          </button>
        )}
        <button disabled={!completePhone(phone)}>
          {
            ["Выбрать пункт выдачи", "Перейти к оплате", "Проверить заказ"][
              step
            ]
          }
        </button>
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
        s.orders.map((o) => (
          <section key={o.id}>
            <Receipt o={o} />
            {o.status !== "Готов к выдаче" && (
              <button
                onClick={() =>
                  update({
                    ...s,
                    orders: s.orders.map((order) =>
                      order.id === o.id
                        ? { ...order, status: "Готов к выдаче" }
                        : order,
                    ),
                  })
                }
              >
                Отметить готовность к выдаче
              </button>
            )}
          </section>
        ))
      ) : (
        <p>Заказов пока нет.</p>
      )}
    </>
  );
}
