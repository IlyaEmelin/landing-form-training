import { NextResponse } from "next/server";
import { z } from "zod";

// Схема проверки данных формы. Здесь же — понятные пользователю сообщения.
const requestSchema = z.object({
  name: z
    .string({ message: "Укажите имя." })
    .trim()
    .min(2, { message: "Имя должно содержать минимум 2 символа." })
    .max(80, { message: "Имя не должно превышать 80 символов." }),
  email: z
    .string({ message: "Укажите email." })
    .trim()
    .max(254, { message: "Email не должен превышать 254 символа." })
    .email({ message: "Укажите корректный email, например name@example.com." }),
  description: z
    .string({ message: "Опишите задачу." })
    .trim()
    .min(10, { message: "Описание должно содержать минимум 10 символов." })
    .max(1000, { message: "Описание не должно превышать 1000 символов." }),
});

// POST /api/requests — приём данных формы.
// Пока только проверяем данные и отвечаем успехом, без сохранения в базе.
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Не удалось прочитать JSON в теле запроса." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      {
        message:
          "Тело запроса должно быть JSON-объектом с полями name, email и description.",
      },
      { status: 400 }
    );
  }

  const result = requestSchema.safeParse(body);

  if (!result.success) {
    const errors: Record<string, string> = {};

    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? "form");

      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }

    return NextResponse.json(
      {
        message: "Проверьте правильность заполнения полей.",
        errors,
      },
      { status: 400 }
    );
  }

  const { name, email, description } = result.data;

  return NextResponse.json({
    message: "API-роут работает",
    request: { name, email, description },
  });
}
