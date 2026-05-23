"use server";

import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface BulkRequestInput {
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  productInterest: string;
  quantity: number;
  message: string;
  contactPreference?: string;
}

export async function submitBulkRequest(input: BulkRequestInput) {
  try {
    if (!input.name || !input.email || !input.phone || !input.productInterest || !input.quantity) {
      return { success: false, error: "Please fill in all mandatory fields." };
    }

    const request = await prisma.bulkRequest.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        businessName: input.businessName || null,
        productInterest: input.productInterest,
        quantity: Number(input.quantity),
        message: input.message,
        contactPreference: input.contactPreference || "EMAIL",
        status: "PENDING",
      },
    });

    // Create a simulated admin notification log
    await prisma.notification.create({
      data: {
        event: "BULK_REQUEST_RECEIVED",
        message: `New bulk quote request #${request.id.substring(0, 8)} from ${input.businessName || input.name} for ${input.quantity}kg of ${input.productInterest}`,
        email: "admin@naturesbestfarm.com",
        type: "EMAIL",
      },
    });

    return { success: true, requestId: request.id };
  } catch (error: any) {
    console.error("Failed to submit bulk request:", error);
    return { success: false, error: error.message || "Failed to submit quote request" };
  }
}

export async function submitBulkRequestForm(formData: FormData) {
  const input = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    businessName: String(formData.get("businessName") || ""),
    productInterest: String(formData.get("productInterest") || ""),
    quantity: Number(formData.get("quantity") || 0),
    message: String(formData.get("message") || ""),
    contactPreference: String(formData.get("contactPreference") || "EMAIL"),
  };

  const result = await submitBulkRequest(input);
  const file = formData.get("specFile");

  if (result.success && result.requestId && file instanceof File && file.size > 0) {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      return { success: false, error: "Only PDF or DOC/DOCX files are supported." };
    }
    const uploadsDir = path.join(process.cwd(), "uploads", "bulk");
    await mkdir(uploadsDir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${result.requestId}-${safeName}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    await prisma.fileUpload.create({
      data: {
        bulkRequestId: result.requestId,
        fileName: file.name,
        fileType: file.type,
        filePath: `/uploads/bulk/${fileName}`,
        size: file.size,
      },
    });
  }

  return result;
}
