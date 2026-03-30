import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CreateEstimateInput, ReviewEstimateInput, UpdateEstimateInput } from "@/lib/contracts/estimates";
import { assertEstimatePositive } from "@/lib/domain/rules";
import { assertProjectAllowsNewEntries } from "@/lib/guards/project";
import { canFullyModerateProject, isRoleScopedManager } from "@/lib/permissions";
import { AuthorizationError, NotFoundError } from "@/lib/domain/errors";

async function userCanUseProject(user: SessionUser, projectId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      ...(isRoleScopedManager(user)
        ? {}
        : {
            employeeGroups: {
              some: {
                employeeGroup: {
                  users: {
                    some: { userId: user.id },
                  },
                },
              },
            },
          }),
      isActive: true,
    },
    select: { id: true },
  });

  return Boolean(project);
}

export async function createEstimate(actor: SessionUser, input: CreateEstimateInput) {
  if (!["EMPLOYEE", "TEAM_LEAD"].includes(actor.userType) && !isRoleScopedManager(actor)) {
    throw new AuthorizationError("You are not allowed to submit estimates.");
  }

  await assertProjectAllowsNewEntries(input.projectId);
  assertEstimatePositive(input.estimatedMinutes);

  const allowed = await userCanUseProject(actor, input.projectId);
  if (!allowed) {
    throw new AuthorizationError("You cannot submit estimates to this project.");
  }

  return db.estimate.create({
    data: {
      projectId: input.projectId,
      employeeId: actor.id,
      countryId: input.countryId || null,
      workDate: new Date(input.workDate),
      estimatedMinutes: input.estimatedMinutes,
      notes: input.notes || null,
      status: "SUBMITTED",
    },
  });
}

export async function reviewEstimate(actor: SessionUser, input: ReviewEstimateInput) {
  const estimate = await db.estimate.findUnique({
    where: { id: input.estimateId },
    include: {
      employee: {
        select: {
          id: true,
          functionalRole: true,
        },
      },
    },
  });

  if (!estimate) throw new NotFoundError("Estimate not found");

  let canReview = canFullyModerateProject(actor);

  if (!canReview && (actor.userType === "TEAM_LEAD" || isRoleScopedManager(actor))) {
    const assignment = await db.employeeTeamLead.findFirst({
      where: {
        teamLeadId: actor.id,
        employeeId: estimate.employeeId,
      },
      select: { id: true },
    });

    canReview = Boolean(assignment && estimate.employee.functionalRole === actor.functionalRole);
  }

  if (!canReview) {
    throw new AuthorizationError("You do not have review access for this estimate.");
  }

  await db.$transaction([
    db.estimateReview.create({
      data: {
        estimateId: estimate.id,
        reviewerId: actor.id,
        decisionStatus: input.action,
        remarks: input.comment || null,
      },
    }),
    db.estimate.update({
      where: { id: estimate.id },
      data: { status: input.action },
    }),
  ]);
}

export async function updateEstimate(actor: SessionUser, input: UpdateEstimateInput) {
  const estimate = await db.estimate.findUnique({
    where: { id: input.estimateId },
  });

  if (!estimate) throw new NotFoundError("Estimate not found");

  const isOwner = estimate.employeeId === actor.id;
  const canOverride = canFullyModerateProject(actor);

  if (!isOwner && !canOverride) {
    throw new AuthorizationError("You are not allowed to update this estimate.");
  }

  if (isOwner && estimate.status !== "REVISED") {
    throw new AuthorizationError("You can only edit estimates that are marked Revised.");
  }

  if (canOverride && !["DRAFT", "REVISED", "SUBMITTED"].includes(estimate.status)) {
    throw new AuthorizationError("This estimate cannot be updated in its current status.");
  }

  return db.estimate.update({
    where: { id: estimate.id },
    data: {
      countryId: input.countryId || null,
      workDate: new Date(input.workDate),
      estimatedMinutes: input.estimatedMinutes,
      notes: input.notes || null,
      status: isOwner ? "SUBMITTED" : estimate.status,
    },
  });
}
