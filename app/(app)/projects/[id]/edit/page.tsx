import Link from "next/link";
import { notFound } from "next/navigation";
import { BillingModel, ProjectStatus } from "@prisma/client";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectEditForm } from "@/components/forms/project-edit-form";
import { db } from "@/lib/db";
import {
  getAwsApiBaseUrl,
  getCountriesFromAws,
  getEmployeeGroupsFromAws,
  getProjectByIdFromAws,
  type AwsProjectDetail,
} from "@/lib/aws-api";

type ProjectCountryLink = {
  countryId: string;
};

type ProjectEmployeeGroupLink = {
  employeeGroupId: string;
};

type EditableProject = {
  id: string;
  name: string;
  billingModel: BillingModel;
  fixedContractHours: number | string | null;
  fixedMonthlyHours: number | string | null;
  status: ProjectStatus;
  description: string | null;
  client: {
    name: string;
  };
  movie: {
    title: string;
  } | null;
  countries: ProjectCountryLink[];
  employeeGroups: ProjectEmployeeGroupLink[];
};

function mapAwsProjectToEditableProject(project: AwsProjectDetail): EditableProject {
  return {
    id: project.id,
    name: project.name,
    billingModel: project.billingModel as BillingModel,
    fixedContractHours: project.fixedContractHours ?? null,
    fixedMonthlyHours: project.fixedMonthlyHours ?? null,
    status: project.status as ProjectStatus,
    description: project.description ?? null,
    client: {
      name: project.client.name,
    },
    movie: project.movie
      ? {
          title: project.movie.title,
        }
      : null,
    countries: project.countries.map((item) => ({
      countryId: item.country.id,
    })),
    employeeGroups: project.employeeGroups.map((item) => ({
      employeeGroupId: item.employeeGroup.id,
    })),
  };
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const useAwsApi = Boolean(getAwsApiBaseUrl());

  const [project, countries, employeeGroups] = useAwsApi
    ? await Promise.all([
        getProjectByIdFromAws(id).then((result) => mapAwsProjectToEditableProject(result.item)),
        getCountriesFromAws({ status: "active" }).then((result) => result.items),
        getEmployeeGroupsFromAws({ status: "active" }).then((result) => result.items),
      ])
    : await Promise.all([
        db.project.findUnique({
          where: { id },
          include: { client: true, movie: true, countries: true, employeeGroups: true },
        }) as Promise<EditableProject | null>,
        db.country.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        db.employeeGroup.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      ]);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Edit project"
        description="Client and Movie are locked after project creation."
        actions={
          <Link href={`/projects/${project.id}`} className="btn-secondary">
            Back to project
          </Link>
        }
      />

      <ProjectEditForm
        projectId={project.id}
        lockedClientName={project.client.name}
        lockedMovieTitle={project.movie?.title ?? null}
        countries={countries}
        employeeGroups={employeeGroups}
        initialValues={{
          name: project.name,
          billingModel: project.billingModel,
          fixedContractHours:
            project.fixedContractHours == null ? null : Number(project.fixedContractHours),
          fixedMonthlyHours:
            project.fixedMonthlyHours == null ? null : Number(project.fixedMonthlyHours),
          status: project.status,
          description: project.description,
          countryIds: project.countries.map((item) => item.countryId),
          employeeGroupIds: project.employeeGroups.map((item) => item.employeeGroupId),
        }}
      />
    </div>
  );
}