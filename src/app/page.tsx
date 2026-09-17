"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import styles from "./page.module.css";

type FormValues = {
  name: string;
  email: string;
  task: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = { name: "", email: "", task: "" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim() === "") {
    errors.name = "Укажите имя.";
  }

  if (values.email.trim() === "") {
    errors.email = "Укажите email.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Похоже, email указан неверно. Пример: name@example.com";
  }

  if (values.task.trim() === "") {
    errors.task = "Опишите задачу.";
  }

  return errors;
}

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

const DEFAULT_ERROR_MESSAGE = "Не удалось отправить заявку. Попробуйте ещё раз.";

const NETWORK_ERROR_MESSAGE =
  "Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.";

// В API поле называется description, в форме — task: переводим сообщения обратно.
function toFormErrors(apiErrors: Record<string, string> = {}): FormErrors {
  const mapped: FormErrors = {};

  for (const [field, message] of Object.entries(apiErrors)) {
    if (field === "name" || field === "email") {
      mapped[field] = message;
    } else if (field === "description") {
      mapped.task = message;
    }
  }

  return mapped;
}

export default function Home() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = event.target.name as keyof FormValues;
    const { value } = event.target;

    setIsSuccess(false);
    setValues((previous) => ({ ...previous, [field]: value }));
    // Пока пользователь исправляет поле, его ошибка больше не показывается.
    setErrors((previous) => {
      if (previous[field] === undefined) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Клиентская проверка пустых полей и формата email — как раньше.
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    setIsSuccess(false);
    setServerError("");

    const invalidFields = Object.keys(nextErrors) as Array<keyof FormValues>;

    if (invalidFields.length > 0) {
      document.getElementById(invalidFields[0])?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          description: values.task.trim(),
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setValues(EMPTY_FORM);
        return;
      }

      // Ошибка проверки на сервере: показываем сообщения, данные не очищаем.
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      const apiErrors = toFormErrors(payload?.errors);
      const firstInvalidField = Object.keys(apiErrors)[0];

      setErrors(apiErrors);
      setServerError(payload?.message ?? DEFAULT_ERROR_MESSAGE);

      if (firstInvalidField) {
        document.getElementById(firstInvalidField)?.focus();
      }
    } catch {
      setServerError(NETWORK_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Навигация по секциям">
          <span className={styles.brand}>Лендинг и форма</span>
          <ul className={styles.navList}>
            <li>
              <a className={styles.navLink} href="#hero">
                Начало
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="#benefits">
                Плюсы
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="#faq">
                Вопросы
              </a>
            </li>
            <li>
              <a className={styles.navLink} href="#form">
                Форма
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.main}>
        <section id="hero" className={`${styles.section} ${styles.hero}`}>
          <h1 className={styles.heroTitle}>
            Разберём задачу и предложим решение
          </h1>
          <p className={styles.heroText}>
            Небольшая учебная страница: рассказываем, чем полезны, отвечаем на
            частые вопросы и собираем заявку через форму ниже.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#form">
              Оставить заявку
            </a>
            <a className={styles.secondaryAction} href="#benefits">
              Посмотреть плюсы
            </a>
          </div>
        </section>
        <section id="benefits" className={styles.section}>
          <h2 className={styles.sectionTitle}>Плюсы</h2>
          <p className={styles.sectionText}>
            Три причины, почему с нами удобно разбирать учебные и рабочие задачи.
          </p>
          <ul className={styles.benefits}>
            <li className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Понятный разбор</h3>
              <p className={styles.benefitText}>
                Сначала формулируем задачу простыми словами, потом предлагаем
                решение.
              </p>
            </li>
            <li className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Быстрый ответ</h3>
              <p className={styles.benefitText}>
                Отвечаем на заявку в тот же день и сразу говорим, что понадобится
                от вас.
              </p>
            </li>
            <li className={styles.benefitCard}>
              <h3 className={styles.benefitTitle}>Без лишних шагов</h3>
              <p className={styles.benefitText}>
                Одна короткая форма вместо долгой переписки и лишних согласований.
              </p>
            </li>
          </ul>
        </section>

        <section id="faq" className={styles.section}>
          <h2 className={styles.sectionTitle}>Вопросы</h2>
          <p className={styles.sectionText}>
            Коротко о том, что чаще всего спрашивают перед заявкой.
          </p>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Что нужно для начала?</h3>
              <p className={styles.faqAnswer}>
                Описать задачу в форме: имя, email и пара предложений о том, что
                нужно сделать.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Сколько времени занимает ответ?
              </h3>
              <p className={styles.faqAnswer}>
                Обычно в течение одного рабочего дня. Если задача срочная, укажите
                это в описании.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Что происходит с данными?</h3>
              <p className={styles.faqAnswer}>
                Форма отправляет данные в API-роут страницы: сервер проверяет их
                по правилам и отвечает результатом проверки.
              </p>
            </div>
          </div>
        </section>

        <section id="form" className={styles.section}>
          <h2 className={styles.sectionTitle}>Оставить заявку</h2>
          <p className={styles.sectionText}>
            Заполните три поля — мы покажем ошибки, если что-то пропущено или
            указано неверно.
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Имя
              </label>
              <input
                className={`${styles.input} ${errors.name ? styles.invalid : ""}`}
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Как к вам обращаться"
                value={values.name}
                onChange={handleChange}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p className={styles.errorText} id="name-error" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                className={`${styles.input} ${errors.email ? styles.invalid : ""}`}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={values.email}
                onChange={handleChange}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p className={styles.errorText} id="email-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="task">
                Описание задачи
              </label>
              <textarea
                className={`${styles.textarea} ${errors.task ? styles.invalid : ""}`}
                id="task"
                name="task"
                rows={5}
                placeholder="Что нужно сделать и какой результат ожидаете"
                value={values.task}
                onChange={handleChange}
                aria-invalid={errors.task ? true : undefined}
                aria-describedby={errors.task ? "task-error" : undefined}
              />
              {errors.task && (
                <p className={styles.errorText} id="task-error" role="alert">
                  {errors.task}
                </p>
              )}
            </div>

            <button
              className={styles.submit}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Отправляем…" : "Отправить заявку"}
            </button>

            {serverError && (
              <p className={styles.formError} role="alert">
                {serverError}
              </p>
            )}

            {isSuccess && (
              <p className={styles.success} role="status">
                Спасибо! Заявка отправлена — сервер принял данные без ошибок.
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
