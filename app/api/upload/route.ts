import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/prisma/prisma";

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    // Get user and check if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get file from form submit
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Check file is correct file type
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Check file is under size limit
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Generate path
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `users/${user.id}/${randomUUID()}-${safeName}`;

    // Upload file to bucket and return error if found
    const { error } = await supabase.storage
      .from("Documents")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Upload to model through prisma client
    const dbFile = await prisma.document.create({
      data: {
        filename: file.name,
        filePath: path,
        fileSize: file.size,
        status: "UPLOADED",
        user: {
          connect: { providerId: user.id },
        },
      },
    });

    return NextResponse.json(dbFile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
