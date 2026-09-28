import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please select a valid image file" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `customers/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from("customer-images")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(
        "Supabase customer image upload error:",
        error
      );

      return NextResponse.json(
        { error: "Failed to upload customer image" },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("customer-images")
      .getPublicUrl(filePath);

    return NextResponse.json({
      message: "Customer image uploaded successfully",
      imageUrl: data.publicUrl,
    });
  } catch (error) {
    console.error("Customer image upload error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while uploading customer image",
      },
      { status: 500 }
    );
  }
}