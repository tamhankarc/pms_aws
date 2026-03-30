import { db } from "@/lib/db";
import type { ClientInput, ToggleClientStatusInput } from "@/lib/contracts/clients";
import { NotFoundError } from "@/lib/domain/errors";

export async function createClient(input: ClientInput) {
  return db.client.create({
    data: {
      name: input.name,
      code: input.code?.trim() || null,
      isActive: Boolean(input.isActive),
    },
  });
}

export async function updateClient(input: ClientInput) {
  if (!input.id) throw new NotFoundError("Client is required.");
  return db.client.update({
    where: { id: input.id },
    data: {
      name: input.name,
      code: input.code?.trim() || null,
      isActive: Boolean(input.isActive),
    },
  });
}

export async function toggleClientStatus(input: ToggleClientStatusInput) {
  const client = await db.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new NotFoundError("Client not found.");

  return db.client.update({
    where: { id: input.clientId },
    data: { isActive: !client.isActive },
  });
}
