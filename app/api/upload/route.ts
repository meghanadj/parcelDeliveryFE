import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { mapParsedXmlToOrderDTO } from "../../../lib/xmlAdapter";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const f: File = file as File;
    const nameIsXml = f.name?.toLowerCase().endsWith(".xml");
    const typeIsXml = (f.type || "").toLowerCase().includes("xml");
    if (!nameIsXml && !typeIsXml) {
      return NextResponse.json({ error: "Unsupported file type. Please upload .xml" }, { status: 415 });
    }

    const text = await f.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    if (!text.trim().startsWith("<?xml") && !text.includes("<")) {
      return NextResponse.json({ error: "Invalid XML content" }, { status: 400 });
    }

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    let parsed: any;
    try {
      parsed = parser.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Malformed XML" }, { status: 400 });
    }

    const order = mapParsedXmlToOrderDTO(parsed);
    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
