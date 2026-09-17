import { NextResponse } from "next/server";

type RequestBody = {
  name: string;
  email: string;
  description: string;
};

// POST /api/requests — временный обработчик формы.
// Пока только принимаем JSON и отвечаем успехом, без проверки и без сохранения.
export async function POST(request: Request) {
  let body: Partial<RequestBody> | null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Не удалось прочитать JSON в теле запроса." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: "API-роут работает",
    request: {
      name: body?.name ?? "",
      email: body?.email ?? "",
      description: body?.description ?? "",
    },
  });
}
