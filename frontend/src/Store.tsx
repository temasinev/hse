/** Витрина, навигация, корзина и личный кабинет демонстрационного магазина. */
import { useEffect, useState } from "react";
import Health from "./App";
import { Art } from "./Art";
import { Login, ProfileForm } from "./Account";
import type { Props } from "./Account";
import { Admin, Checkout, Receipt } from "./Orders";
import { addLine, colors, money, read, save, total, types } from "./shop";
import type { Product, State } from "./shop";
import "./store.css";
const option = (x: string) => <option key={x}>{x}</option>;
function Cards({ items }: { items: Product[] }) {
  return (
    <div className="cards">
      {items.map((p) => (
        <a className="card" key={p.id} href={"#item/" + p.id}>
          <Art p={p} />
          <small>
            {p.type} · {p.available ? "В наличии" : "Под заказ недоступно"}
          </small>
          <h3>{p.name}</h3>
          <span>{money(p.price)}</span>
        </a>
      ))}
    </div>
  );
}
function Catalog({ items, category }: { items: Product[]; category: string }) {
  const [q, Q] = useState(""),
    [type, T] = useState(category),
    [color, C] = useState(""),
    [sort, S] = useState("");
  const shown = items
    .filter(
      (p) =>
        (!type || p.type === type) &&
        (!color || p.color === color) &&
        [p.name, p.type, p.material, p.color, p.description]
          .join(" ")
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
        : sort === "desc"
          ? b.price - a.price
          : 0,
    );
  return (
    <>
      <small>ВИТРИНА / КОЛЛЕКЦИЯ</small>
      <h1>Каталог украшений</h1>
      <div className="filters">
        <label>
          Поиск
          <input
            type="search"
            placeholder="Название, материал…"
            value={q}
            onChange={(e) => Q(e.target.value)}
          />
        </label>
        <label>
          Категория
          <select value={type} onChange={(e) => T(e.target.value)}>
            <option value="">Все украшения</option>
            {types.map(option)}
          </select>
        </label>
        <label>
          Цвет
          <select value={color} onChange={(e) => C(e.target.value)}>
            <option value="">Все цвета</option>
            {colors.map(option)}
          </select>
        </label>
        <label>
          Сортировка
          <select value={sort} onChange={(e) => S(e.target.value)}>
            <option value="">По коллекции</option>
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
          </select>
        </label>
        <button
          className="quiet"
          onClick={() => {
            Q("");
            T("");
            C("");
            S("");
          }}
        >
          Сбросить
        </button>
      </div>
      <p>Изделий: {shown.length}</p>
      {shown.length ? <Cards items={shown} /> : <h2>Ничего не найдено</h2>}
    </>
  );
}
function Item({ p, s, update }: { p: Product } & Props) {
  const [size, S] = useState(p.sizes[0] || ""),
    [note, N] = useState(""),
    [detail, D] = useState(false),
    [added, A] = useState(false);
  const related = s.items.filter(
    (x) => x.id !== p.id && (x.color === p.color || x.type === p.type),
  );
  return (
    <>
      <a href="#catalog">← Каталог</a>
      <div className="duo">
        <div>
          <Art p={p} detail={detail} />
          {!p.photo && (
            <button className="quiet" onClick={() => D(!detail)}>
              {detail ? "Общий вид" : "Рассмотреть детали"}
            </button>
          )}
        </div>
        <section>
          <small>{p.type} / Демоизделие</small>
          <h1>{p.name}</h1>
          <h2>{money(p.price)}</h2>
          <p>{p.description}</p>
          <p>
            {p.material} · {p.color}
          </p>
          {p.sizes.length > 0 && (
            <label>
              Размер
              <select
                value={size}
                onChange={(e) => {
                  S(e.target.value);
                  A(false);
                }}
              >
                {p.sizes.map(option)}
              </select>
            </label>
          )}
          <label>
            Индивидуальный размер или пожелание
            <input
              value={note}
              onChange={(e) => {
                N(e.target.value);
                A(false);
              }}
            />
          </label>
          <button
            disabled={!p.available}
            onClick={() => {
              update({
                ...s,
                cart: addLine(s.cart, {
                  id: p.id,
                  name: p.name,
                  size,
                  note: note.trim(),
                  qty: 1,
                  price: p.price,
                }),
              });
              A(true);
            }}
          >
            {p.available ? "Добавить в корзину" : "Нет в наличии"}
          </button>
          {added && (
            <p>
              Добавлено · <a href="#cart">Перейти в корзину →</a>
            </p>
          )}
        </section>
      </div>
      <h2>В пару к украшению</h2>
      <Cards items={related.slice(0, 4)} />
    </>
  );
}
export default function Store() {
  const [s, set] = useState(read),
    [hash, H] = useState(location.hash.slice(1)),
    [notice, N] = useState("");
  useEffect(() => {
    const cb = () => {
      H(location.hash.slice(1));
      N("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", cb);
    return () => window.removeEventListener("hashchange", cb);
  }, []);
  function update(next: State) {
    save(next);
    set(next);
  }
  const [page, id = ""] = hash.split("/"),
    user = s.users.find((u) => u.phone === s.session),
    p = s.items.find((p) => p.id === id),
    order = s.orders.find((o) => o.id === id && o.owner === user?.phone),
    props = { s, update };
  const lines = s.cart.map((l) => ({
    ...l,
    price: s.items.find((p) => p.id === l.id)?.price ?? l.price,
  }));
  function qty(index: number, value: number) {
    update({
      ...s,
      cart: lines
        .map((l, i) => (i === index ? { ...l, qty: value } : l))
        .filter((l) => l.qty > 0),
    });
  }
  let content;
  if (!page)
    content = (
      <>
        <div className="hero">
          <div>
            <small>СМОРОДИНА / КОЛЛЕКЦИЯ 01</small>
            <h1>
              Украшения
              <br />
              <i>в цвете ягод</i>
            </h1>
            <p>
              Колье, серьги и кольца. Найдите свой оттенок и соберите украшения
              в комплект.
            </p>
            <a className="btn" href="#catalog">
              Открыть каталог ↗
            </a>
          </div>
          <figure>
            <Art p={s.items[0]} />
            <figcaption>ИЛЛЮСТРАЦИЯ № 01 / {s.items[0].name}</figcaption>
          </figure>
        </div>
        <div className="categories">
          {types.map((t) => (
            <a key={t} href={"#catalog/" + encodeURIComponent(t)}>
              {t} ↗
            </a>
          ))}
        </div>
        <small>ВЫБОР ВИТРИНЫ</small>
        <h2>Детали коллекции</h2>
        <Cards items={s.items.slice(0, 4)} />
      </>
    );
  else if (page === "catalog")
    content = (
      <Catalog key={id} items={s.items} category={decodeURIComponent(id)} />
    );
  else if (page === "item" && p) content = <Item key={id} p={p} {...props} />;
  else if (page === "cart")
    content = (
      <>
        <h1>Корзина</h1>
        {lines.length ? (
          <>
            {lines.map((l, i) => (
              <article className="line" key={i}>
                <a href={"#item/" + l.id}>{l.name}</a>
                <span>
                  {l.size} {l.note}{" "}
                  {!s.items.find((p) => p.id === l.id)?.available &&
                    " · Нет в наличии"}
                </span>
                <div>
                  <button
                    aria-label="Уменьшить"
                    onClick={() => qty(i, l.qty - 1)}
                  >
                    −
                  </button>{" "}
                  {l.qty}{" "}
                  <button
                    aria-label="Увеличить"
                    onClick={() => qty(i, l.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <b>{money(l.price * l.qty)}</b>
                <button className="quiet" onClick={() => qty(i, 0)}>
                  Удалить
                </button>
              </article>
            ))}
            <h2>Итого {money(total(lines))}</h2>
            <a className="btn" href="#checkout">
              Оформить заказ
            </a>
          </>
        ) : (
          <p>
            Корзина пока пуста. <a href="#catalog">Выбрать украшение →</a>
          </p>
        )}
      </>
    );
  else if ((page === "profile" || page === "checkout") && !user)
    content = <Login {...props} after={page} />;
  else if (page === "checkout") content = <Checkout {...props} />;
  else if (page === "profile" && user)
    content = (
      <>
        <h1>Личный кабинет</h1>
        <section className="panel">
          <p>{user.phone}</p>
          <ProfileForm
            user={user}
            register={false}
            onSave={(u) => {
              update({
                ...s,
                users: s.users.map((v) => (v.phone === u.phone ? u : v)),
              });
              N("Профиль сохранён");
            }}
          />
          {notice}
          <hr />
          <button
            onClick={() => {
              if (confirm("Вы уверены, что хотите выйти?"))
                update({ ...s, session: "" });
            }}
          >
            Выйти из аккаунта
          </button>{" "}
          <button
            className="quiet"
            onClick={() => {
              if (confirm("Удалить аккаунт и историю заказов?"))
                update({
                  ...s,
                  session: "",
                  users: s.users.filter((u) => u !== user),
                  orders: s.orders.filter((o) => o.owner !== user.phone),
                });
            }}
          >
            Удалить аккаунт
          </button>
        </section>
        <h2>Ваши заказы</h2>
        {s.orders
          .filter((o) => o.owner === user.phone)
          .map((o) => (
            <Receipt key={o.id} o={o} />
          ))}
        {!s.orders.some((o) => o.owner === user.phone) && (
          <p>Пока нет заказов.</p>
        )}
      </>
    );
  else if (page === "order" && order)
    content = (
      <>
        <h1>Заказ оформлен</h1>
        <Receipt o={order} />
        <a href="#profile">В личный кабинет →</a>
      </>
    );
  else if (page === "admin") content = <Admin {...props} />;
  else if (page === "health") content = <Health />;
  else if (page === "terms")
    content = (
      <>
        <h1>Условия демонстрации</h1>
        <h2>Пользовательское соглашение · проект</h2>
        <p>
          Витрина предназначена для учебного заказа с вымышленными данными.
          Реальные сделки и платежи не проводятся.
        </p>
        <h2>Политика обработки данных · проект</h2>
        <p>
          Демо сохраняет профиль и заказы в этом браузере. Удалить их можно в
          кабинете. Оба документа требуют заполнения и проверки владельцем перед
          запуском продаж.
        </p>
      </>
    );
  else
    content = (
      <>
        <h1>Страница не найдена</h1>
        <a href="#">На главную</a>
      </>
    );
  return (
    <>
      <header>
        <a className="logo" href="#">
          Смородина<span>✳</span>
        </a>
        <nav>
          <a href="#catalog">Каталог и поиск</a>
          <a href="#profile">Кабинет</a>
          <a href="#cart">Корзина ({lines.reduce((n, l) => n + l.qty, 0)})</a>
        </nav>
      </header>
      <main key={page}>{content}</main>
      <footer>
        <b>Смородина</b>
        <p>Учебная витрина · тестовый ассортимент и иллюстрации</p>
        <a href="#admin">Демо мастерской</a> <a href="#terms">Условия</a>{" "}
        <a href="#health">Статус системы</a>
      </footer>
    </>
  );
}
