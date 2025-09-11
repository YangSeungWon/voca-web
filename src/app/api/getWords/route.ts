import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Word } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get("userKey");

  if (!userKey) {
    return NextResponse.json(
      { error: "userKey is required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { key: userKey },
    include: { words: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const words: Word[] = user.words.filter((word: Word) => !word.isDeleted);

  return NextResponse.json(words, { status: 200 });
}
