import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import type { ChangePasswordInput, UpdateProfileInput } from "@/lib/contracts/profile";
import { NotFoundError, ValidationError } from "@/lib/domain/errors";

export async function updateProfile(actor: SessionUser, input: UpdateProfileInput) {
  const permanentSameAsCurrent = Boolean(input.permanentSameAsCurrent);
  const currentAddress = input.currentAddress?.trim() || null;
  const permanentAddress = permanentSameAsCurrent ? currentAddress : input.permanentAddress?.trim() || null;

  return db.user.update({
    where: { id: actor.id },
    data: {
      fullName: input.fullName?.trim() || actor.fullName || actor.name,
      phoneNumber: input.phoneNumber?.trim() || null,
      currentAddress,
      permanentAddress,
      permanentSameAsCurrent,
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      designation: true,
      userType: true,
      functionalRole: true,
    },
  });
}

export async function changePassword(actor: SessionUser, input: ChangePasswordInput) {
  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user) throw new NotFoundError("User not found.");

  const isValid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!isValid) throw new ValidationError("Current password is incorrect.");

  const passwordHash = await hashPassword(input.newPassword);
  await db.user.update({
    where: { id: actor.id },
    data: { passwordHash },
  });
}
