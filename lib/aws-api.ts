import "server-only";

import { getSession } from "@/lib/auth";
import { createApiAccessToken } from "@/lib/api-token";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/contracts/projects";

export type AwsClientListItem = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  movieCount: number;
};

export type AwsCountryListItem = {
  id: string;
  name: string;
  isoCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
};

export type AwsMovieListItem = {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  clientId: string;
  client: {
    id: string;
    name: string;
    code: string | null;
  };
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AwsProjectListItem = {
  id: string;
  name: string;
  code: string | null;
  status: string;
  billingModel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    code?: string | null;
  };
  movie: {
    id: string;
    title: string;
    code?: string | null;
  } | null;
  countries: Array<{
    id: string;
    country: {
      id: string;
      name: string;
      isoCode?: string | null;
    };
  }>;
  employeeGroups: Array<{
    id: string;
    employeeGroup: {
      id: string;
      name: string;
    };
  }>;
};

export type AwsProjectDetail = AwsProjectListItem & {
  fixedContractHours: string | number | null;
  fixedMonthlyHours: string | number | null;
  description: string | null;
  billingTransactions: Array<{
    id: string;
    transactionType: string;
    amountMoney: string | number | null;
    amountHours: string | number | null;
    description: string | null;
    effectiveDate: string;
    createdAt: string;
  }>;
  timeEntries: Array<{
    id: string;
    minutesSpent: number;
    status: string;
    isBillable: boolean;
    workDate: string;
  }>;
};

export type AwsEmployeeGroupListItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  users: Array<{
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      userType: string;
    };
  }>;
  projectsCount: number;
};

export type AwsUserListItem = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  userType: string;
  functionalRole: string | null;
  employeeCode: string | null;
  designation: string | null;
  joiningDate: string | null;
  isActive: boolean;
  employeeGroups: Array<{ id: string; employeeGroup: { id: string; name: string } }>;
  teamLeadAssignmentsAsEmployee: Array<{
    id: string;
    teamLead: { id: string; fullName: string; userType: string };
  }>;
};

export type AwsTimeEntryListItem = {
  id: string;
  employeeId: string;
  employee: { id: string; fullName: string };
  project: { id: string; name: string };
  projectId: string;
  taskName: string;
  countryId: string | null;
  workDate: string;
  minutesSpent: number;
  notes: string | null;
  status: string;
};

export type AwsEstimateListItem = {
  id: string;
  employeeId: string;
  countryId: string | null;
  estimatedMinutes: number;
  status: string;
  project: { id: string; name: string };
  employee: { id: string; fullName: string; functionalRole: string | null };
  reviews: Array<{
    id: string;
    remarks: string | null;
    reviewedAt: string;
    reviewer: { id: string; fullName: string };
  }>;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAwsApiBaseUrl() {
  const value = process.env.AWS_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return value ? normalizeBaseUrl(value) : "";
}

async function getServerApiAccessToken() {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return createApiAccessToken(user, "15m");
}

export async function awsApiServerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getAwsApiBaseUrl();
  if (!baseUrl) {
    throw new Error("AWS API base URL is not configured");
  }

  const token = await getServerApiAccessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`AWS API request failed (${response.status}): ${bodyText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getClientsFromAws(params: { q?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());

  const query = searchParams.toString();
  return awsApiServerFetch<{ items: AwsClientListItem[] }>(`/lookups/clients${query ? `?${query}` : ""}`);
}

export async function getCountriesFromAws(params: { q?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());

  const query = searchParams.toString();
  return awsApiServerFetch<{ items: AwsCountryListItem[] }>(`/lookups/countries${query ? `?${query}` : ""}`);
}

export async function getMoviesFromAws(params: { q?: string; status?: string; clientId?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());
  if (params.clientId?.trim()) searchParams.set("clientId", params.clientId.trim());

  const query = searchParams.toString();
  return awsApiServerFetch<{ items: AwsMovieListItem[] }>(`/lookups/movies${query ? `?${query}` : ""}`);
}

export async function getProjectsFromAws() {
  return awsApiServerFetch<{ items: AwsProjectListItem[] }>("/projects");
}

export async function getProjectByIdFromAws(id: string) {
  return awsApiServerFetch<{ item: AwsProjectDetail }>(`/projects/${id}`);
}

export async function createProjectViaAws(input: CreateProjectInput) {
  return awsApiServerFetch<{ item: { id: string } }>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProjectViaAws(projectId: string, input: UpdateProjectInput) {
  return awsApiServerFetch<{ item: { id: string } }>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function getEmployeeGroupsFromAws(params: { q?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());
  const query = searchParams.toString();
  return awsApiServerFetch<{ items: AwsEmployeeGroupListItem[] }>(`/employee-groups${query ? `?${query}` : ""}`);
}

export async function getUsersFromAws(params: { q?: string; status?: string; userType?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());
  if (params.userType?.trim() && params.userType !== "all") searchParams.set("userType", params.userType.trim());
  const query = searchParams.toString();
  return awsApiServerFetch<{ items: AwsUserListItem[] }>(`/users${query ? `?${query}` : ""}`);
}

export async function getTimeEntriesFromAws() {
  return awsApiServerFetch<{ items: AwsTimeEntryListItem[] }>("/time-entries");
}

export async function getEstimatesFromAws() {
  return awsApiServerFetch<{ items: AwsEstimateListItem[] }>("/estimates");
}
