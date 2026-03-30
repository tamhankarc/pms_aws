import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  type CreateBillingTransactionInput,
  type CreateProjectInput,
  type ToggleProjectStatusInput,
  type UpdateProjectInput,
} from "@/lib/contracts/projects";
import { NotFoundError, ValidationError } from "@/lib/domain/errors";
import { generateProjectCode } from "@/lib/project-code";

async function validateMovieForClient(clientId: string, movieId?: string | null) {
  if (!movieId) return true;
  const movie = await db.movie.findUnique({
    where: { id: movieId },
    select: { id: true, clientId: true, isActive: true },
  });
  return Boolean(movie && movie.clientId === clientId && movie.isActive);
}

export async function createProject(actor: SessionUser, input: CreateProjectInput) {
  const movieValid = await validateMovieForClient(input.clientId, input.movieId);
  if (!movieValid) {
    throw new ValidationError("Selected movie does not belong to the selected client.");
  }

  const projectCode = await generateProjectCode(input.clientId);

  return db.project.create({
    data: {
      clientId: input.clientId,
      movieId: input.movieId || null,
      name: input.name,
      code: projectCode,
      billingModel: input.billingModel,
      fixedContractHours: input.billingModel === "FIXED_FULL" ? (input.fixedContractHours ?? 0) : null,
      fixedMonthlyHours: input.billingModel === "FIXED_MONTHLY" ? (input.fixedMonthlyHours ?? 0) : null,
      status: input.status,
      description: input.description || null,
      createdById: actor.id,
      updatedById: actor.id,
      countries: {
        create: input.countryIds.map((countryId) => ({ countryId })),
      },
      employeeGroups: {
        create: input.employeeGroupIds.map((employeeGroupId) => ({ employeeGroupId })),
      },
    },
  });
}

export async function updateProject(actor: SessionUser, projectId: string, input: UpdateProjectInput) {
  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: {
        name: input.name,
        billingModel: input.billingModel,
        fixedContractHours: input.billingModel === "FIXED_FULL" ? (input.fixedContractHours ?? 0) : null,
        fixedMonthlyHours: input.billingModel === "FIXED_MONTHLY" ? (input.fixedMonthlyHours ?? 0) : null,
        status: input.status,
        description: input.description || null,
        updatedById: actor.id,
      },
    });

    await tx.projectCountry.deleteMany({ where: { projectId } });
    await tx.projectCountry.createMany({
      data: input.countryIds.map((countryId) => ({ projectId, countryId })),
      skipDuplicates: true,
    });

    await tx.projectEmployeeGroup.deleteMany({ where: { projectId } });
    await tx.projectEmployeeGroup.createMany({
      data: input.employeeGroupIds.map((employeeGroupId) => ({
        projectId,
        employeeGroupId,
      })),
      skipDuplicates: true,
    });
  });
}

export async function createBillingTransaction(input: CreateBillingTransactionInput) {
  return db.billingTransaction.create({
    data: {
      projectId: input.projectId,
      transactionType: input.type,
      amountMoney: input.amount,
      amountHours: null,
      description: input.note,
      effectiveDate: new Date(),
    },
  });
}

export async function toggleProjectStatus(input: ToggleProjectStatusInput) {
  const project = await db.project.findUnique({ where: { id: input.projectId } });
  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  return db.project.update({
    where: { id: input.projectId },
    data: { isActive: !project.isActive },
  });
}
