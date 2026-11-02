/** Локальная демонстрация входа и редактирования профиля. */
import { useEffect, useState } from "react";
import { mask, sms } from "./shop";
import type { State, User } from "./shop";
export type Props = { s: State; update: (next: State) => void };
export function ProfileForm({
  user,
  register,
  onSave,
}: {
  user: User;
  register: boolean;
  onSave: (u: User) => void;
}) {
  const [photo, setPhoto] = useState(user.photo);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        onSave({
          ...user,
          name: String(d.get("name")).trim(),
          email: String(d.get("email")),
          birth: String(d.get("birth")),
          photo,
        });
      }}
    >
      <label>
        Имя
        <input name="name" required pattern=".*\S.*" defaultValue={user.name} />
      </label>
      <label>
        Email
        <input name="email" type="email" defaultValue={user.email} />
      </label>
      <label>
        Дата рождения
        <input
          type="date"
          name="birth"
          max={new Date().toLocaleDateString("sv-SE")}
          defaultValue={user.birth}
        />
      </label>
      <label>
        Фото профиля (до 200 КБ)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 200000 || !f.type.startsWith("image/")) {
              alert("Выберите изображение до 200 КБ");
              return;
            }
            const r = new FileReader();
            r.onload = () => setPhoto(String(r.result));
            r.readAsDataURL(f);
          }}
        />
      </label>
      {photo && <img width="68" alt="Аватар" src={photo} />}
      {register && (
        <label>
          <input required type="checkbox" /> Принимаю{" "}
          <a href="#terms" target="_blank">
            соглашение и политику обработки данных
          </a>
        </label>
      )}
      <button>
        {register ? "Завершить регистрацию" : "Сохранить профиль"}
      </button>
    </form>
  );
}
type Ticket = {
  phone: string;
  code: string;
  until: number;
  blocked: number;
  errors: number;
  register: boolean;
};
export function Login({ s, update, after }: { after: string } & Props) {
  const [ticket, T] = useState<Ticket | null>(() =>
      JSON.parse(sessionStorage.getItem("berry.ticket") || "null"),
    ),
    [phone, P] = useState("+7"),
    [register, R] = useState(false),
    [verified, V] = useState(false),
    [err, E] = useState(""),
    [input, I] = useState(""),
    [now, N] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => N(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  function ticketSet(t: Ticket | null) {
    T(t);
    sessionStorage.setItem("berry.ticket", JSON.stringify(t));
  }
  function issue(number: string, reg: boolean) {
    ticketSet({
      phone: number,
      register: reg,
      code: sms.issue(),
      until: Date.now() + 60000,
      blocked: 0,
      errors: 0,
    });
    I("");
    E("");
  }
  function done(u: User) {
    update({
      ...s,
      session: u.phone,
      users: [...s.users.filter((v) => v.phone !== u.phone), u],
    });
    ticketSet(null);
    location.assign("#" + after);
  }
  function verify() {
    if (!ticket || ticket.blocked > Date.now()) return;
    if (input !== ticket.code) {
      const errors = ticket.errors + 1;
      ticketSet({
        ...ticket,
        errors: errors === 3 ? 0 : errors,
        blocked: errors === 3 ? Date.now() + 60000 : 0,
      });
      I("");
      E("Неверный код. Попробуйте снова");
      return;
    }
    if (ticket.register) V(true);
    else done(s.users.find((u) => u.phone === ticket.phone)!);
  }
  const wait = ticket
    ? Math.max(
        0,
        Math.ceil((Math.max(ticket.until, ticket.blocked) - now) / 1000),
      )
    : 0;
  return (
    <section className="panel">
      <small>ЛИЧНЫЙ КАБИНЕТ</small>
      <h1>
        {verified
          ? "Ваш профиль"
          : ticket
            ? "Проверка телефона"
            : register
              ? "Регистрация"
              : "Вход"}
      </h1>
      <p>Локальное демо. Используйте вымышленный номер и тестовые данные.</p>
      {verified && ticket ? (
        <ProfileForm
          register
          user={{
            phone: ticket.phone,
            name: "",
            email: "",
            birth: "",
            photo: "",
          }}
          onSave={done}
        />
      ) : ticket ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <p>
            {ticket.phone} · Демо-код <b>{ticket.code}</b>
          </p>
          <label>
            Шестизначный код
            <input
              value={input}
              onChange={(e) => I(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              required
              pattern="[0-9]{6}"
              disabled={ticket.blocked > now}
            />
          </label>
          <button disabled={ticket.blocked > now}>
            {ticket.blocked > now
              ? "Ввод заблокирован · " +
                Math.ceil((ticket.blocked - now) / 1000) +
                " с"
              : "Подтвердить код"}
          </button>
          <button
            type="button"
            disabled={wait > 0}
            onClick={() => issue(ticket.phone, ticket.register)}
          >
            Новый код {wait > 0 && "через " + wait + " с"}
          </button>
          <button
            type="button"
            disabled={wait > 0}
            onClick={() => ticketSet(null)}
          >
            Изменить номер
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const exists = s.users.some((u) => u.phone === phone);
            if (exists === register) {
              E(
                exists
                  ? "Этот номер зарегистрирован. Выберите вход."
                  : "Номер не найден. Выберите регистрацию.",
              );
              return;
            }
            issue(phone, register);
          }}
        >
          <label>
            Телефон
            <input
              type="tel"
              required
              minLength={18}
              value={phone}
              onChange={(e) => P(mask(e.target.value))}
            />
          </label>
          <button>Продолжить</button>
          <button
            className="quiet"
            type="button"
            onClick={() => {
              R(!register);
              E("");
            }}
          >
            {register ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
      )}
      {err && <p role="alert">{err}</p>}
    </section>
  );
}
