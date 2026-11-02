/** Общая телефонная маска для входа, регистрации и заказа. */
import { mask } from "./shop";
export function PhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      Телефон
      <input
        type="tel"
        name="phone"
        autoComplete="tel"
        inputMode="tel"
        placeholder="+7(XXX)-XXX-XX-XX"
        aria-describedby="phone-format"
        required
        pattern={String.raw`\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}`}
        value={value}
        onChange={(e) => {
          const field = e.currentTarget,
            raw = field.value;
          const digitsAfter = raw
            .slice(field.selectionStart ?? raw.length)
            .replace(/\D/g, "").length;
          const formatted = raw.replace(/\D/g, "") ? mask(raw) : "";
          onChange(formatted);
          let pos = formatted.length,
            left = digitsAfter;
          while (pos > 0 && left > 0) {
            if (/\d/.test(formatted[--pos])) left--;
          }
          requestAnimationFrame(() => field.setSelectionRange(pos, pos));
        }}
        onKeyDown={(e) => {
          const f = e.currentTarget,
            start = f.selectionStart ?? 0,
            end = f.selectionEnd ?? 0;
          if (start !== end) return;
          if (
            e.key === "Backspace" &&
            start > 2 &&
            /\D/.test(value[start - 1])
          ) {
            let at = start - 1;
            while (at > 2 && /\D/.test(value[at])) at--;
            f.setSelectionRange(at, start);
          } else if (
            e.key === "Delete" &&
            start < value.length &&
            /\D/.test(value[start])
          ) {
            let at = start;
            while (at < value.length && /\D/.test(value[at])) at++;
            f.setSelectionRange(start, at + 1);
          }
        }}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text").trim();
          if (/^\d{10,11}$/.test(pasted.replace(/\D/g, ""))) {
            e.preventDefault();
            onChange(mask(pasted));
          }
        }}
      />
      <small id="phone-format">Формат: +7(XXX)-XXX-XX-XX</small>
    </label>
  );
}
