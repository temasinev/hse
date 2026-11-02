/** Регистрация и покупка с сохранением демоданных старого формата. */
import { render, screen, fireEvent } from "@testing-library/react";
import { Login } from "./Account";
import { Checkout } from "./Orders";
import { completePhone, mask, read } from "./shop";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
it("одинаково форматирует вставленные и ранее сохранённые телефоны", () => {
  for (const value of ["8 999 123 45 67", "+7 (999) 123-45-67", "9991234567"])
    expect(mask(value)).toBe("+7(999)-123-45-67");
  expect(completePhone(mask("999123"))).toBe(false);
  const s = read(),
    old = "+7 (999) 123-45-67";
  localStorage.setItem(
    "smorodina.demo.v1",
    JSON.stringify({
      ...s,
      session: old,
      users: [{ phone: old }],
      orders: [{ owner: old, phone: old }],
    }),
  );
  expect(read().users[0].phone).toBe(read().orders[0].owner);
  expect(read().session).toBe("+7(999)-123-45-67");
});
it("требует номер, шесть цифр кода, имя и согласие", () => {
  const update = vi.fn();
  render(<Login s={read()} update={update} after="profile" />);
  fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
  expect(screen.getByText("Продолжить")).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: /Телефон/ }), {
    target: { value: "89991234567" },
  });
  fireEvent.click(screen.getByText("Продолжить"));
  const code = document.querySelector("form b")!.textContent!;
  expect(screen.getAllByRole("textbox")).toHaveLength(6);
  expect(screen.getByText("Подтвердить код")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Цифра 1 из 6"), {
    target: { value: code },
  });
  fireEvent.click(screen.getByText("Подтвердить код"));
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Тест" } });
  expect(screen.getByText("Завершить регистрацию")).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByText("Завершить регистрацию"));
  expect(update.mock.calls[0][0].session).toBe("+7(999)-123-45-67");
});
it("сохраняет выбранный ПВЗ при возврате и создаёт заказ после демооплаты", () => {
  const s = read(),
    update = vi.fn();
  s.session = mask("9991234567");
  s.users = [
    { phone: s.session, name: "Тест", email: "", birth: "", photo: "" },
  ];
  s.cart = [
    {
      id: s.items[0].id,
      name: "Колье",
      size: "45 см",
      qty: 1,
      note: "",
      price: 1200,
    },
  ];
  render(<Checkout s={s} update={update} />);
  fireEvent.click(screen.getByText("Выбрать пункт выдачи"));
  const pickup = screen.getByRole("combobox") as HTMLSelectElement;
  fireEvent.change(pickup, { target: { value: pickup.options[1].value } });
  fireEvent.click(screen.getByText("Перейти к оплате"));
  fireEvent.click(screen.getByText("Назад"));
  expect(screen.getByRole("combobox")).toHaveValue(pickup.options[1].value);
  fireEvent.click(screen.getByText("Перейти к оплате"));
  fireEvent.click(screen.getByText("Проверить заказ"));
  fireEvent.click(screen.getByText("Проверить отказ"));
  expect(update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Подтвердить демооплату"));
  expect(update.mock.calls[0][0].orders[0].pickup).toBe(pickup.value);
});
