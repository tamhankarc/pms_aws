import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { createBillingTransactionAction } from "@/lib/actions/project-actions";
import { db } from "@/lib/db";
import { formatMinutes } from "@/lib/utils";
import { getAwsApiBaseUrl, getProjectByIdFromAws, type AwsProjectDetail } from "@/lib/aws-api";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const useAwsApi = Boolean(getAwsApiBaseUrl());

  const project = useAwsApi
    ? (await getProjectByIdFromAws(id)).item
    : await db.project.findUnique({
        where: { id },
        include: {
          client: true,
          movie: true,
          countries: { include: { country: true } },
          employeeGroups: { include: { employeeGroup: true } },
          billingTransactions: { orderBy: { createdAt: "desc" } },
          timeEntries: true,
        },
      });

  if (!project) notFound();

  const typedProject = project as AwsProjectDetail | NonNullable<Awaited<typeof project>>;

  const approvedMinutes = typedProject.timeEntries
    .filter((entry) => entry.status === "APPROVED")
    .reduce((sum, entry) => sum + entry.minutesSpent, 0);

  const approvedBillableMinutes = typedProject.timeEntries
    .filter((entry) => entry.status === "APPROVED" && entry.isBillable)
    .reduce((sum, entry) => sum + entry.minutesSpent, 0);

  const fixedHours =
    typedProject.billingModel === "FIXED_FULL"
      ? Number(typedProject.fixedContractHours ?? 0)
      : Number(typedProject.fixedMonthlyHours ?? 0);

  return (
    <div>
      <PageHeader
        title={typedProject.name}
        description={`${typedProject.client.name} · ${typedProject.billingModel.replaceAll("_", " ")} · ${typedProject.movie?.title ?? "No movie linked"}`}
        actions={
          <Link className="btn-secondary" href={`/projects/${typedProject.id}/edit`}>
            Edit project
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Approved effort</p>
              <p className="mt-2 text-2xl font-semibold">{formatMinutes(approvedMinutes)}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Approved billable effort</p>
              <p className="mt-2 text-2xl font-semibold">{formatMinutes(approvedBillableMinutes)}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">
                {typedProject.billingModel === "FIXED_MONTHLY" ? "Included monthly hours" : "Fixed contract hours"}
              </p>
              <p className="mt-2 text-2xl font-semibold">{fixedHours || 0}</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="section-title">Project profile</h2>
            <p className="section-subtitle">
              This summary shows how the project is classified, who can see it, and how it is commercially tracked.
            </p>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Client</dt>
                <dd className="mt-1 text-sm text-slate-800">{typedProject.client.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Movie</dt>
                <dd className="mt-1 text-sm text-slate-800">{typedProject.movie?.title ?? "No movie linked"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Countries</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {typedProject.countries.map((c) => c.country.name).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Employee groups</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {typedProject.employeeGroups.map((g) => g.employeeGroup.name).join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Billing model</dt>
                <dd className="mt-1 text-sm text-slate-800">{typedProject.billingModel.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Project code</dt>
                <dd className="mt-1 text-sm text-slate-800">{typedProject.code || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1 text-sm text-slate-800">{typedProject.status.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Active</dt>
                <dd className="mt-1 text-sm text-slate-800">{typedProject.isActive ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          <div className="table-wrap">
            <div className="border-b border-slate-200 px-4 py-4">
              <h2 className="section-title">Billing transactions</h2>
              <p className="section-subtitle">
                Transactions are optional and are used for upgrade/adjustment tracking against the project.
              </p>
            </div>
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-cell">Transaction type</th>
                  <th className="table-cell">Money adjustment</th>
                  <th className="table-cell">Hour adjustment</th>
                  <th className="table-cell">Description</th>
                  <th className="table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {typedProject.billingTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="table-cell">{tx.transactionType.replaceAll("_", " ")}</td>
                    <td className="table-cell">{tx.amountMoney == null ? "—" : Number(tx.amountMoney)}</td>
                    <td className="table-cell">{tx.amountHours == null ? "—" : Number(tx.amountHours)}</td>
                    <td className="table-cell">{tx.description || "—"}</td>
                    <td className="table-cell">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(tx.createdAt))}
                    </td>
                  </tr>
                ))}
                {typedProject.billingTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-cell text-slate-500">No transactions yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card p-6">
          <h2 className="section-title">Add billing transaction</h2>
          <p className="section-subtitle">
            Use this for project upgrades, partial billing records, or adjustments. Add a clear note for reporting clarity.
          </p>

          <form action={createBillingTransactionAction} className="mt-5 space-y-4">
            <input type="hidden" name="projectId" value={typedProject.id} />
            <div>
              <label className="label">Type <span className="text-red-600">*</span></label>
              <select className="input" name="type" required>
                <option value="PARTIAL_BILLING">Partial billing</option>
                <option value="UPGRADE_PRE_COMPLETION">Upgrade before completion</option>
                <option value="UPGRADE_POST_COMPLETION">Upgrade after completion</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
            <div>
              <label className="label">Money adjustment <span className="text-red-600">*</span></label>
              <input className="input" name="amount" type="number" step="0.01" required />
            </div>
            <div>
              <label className="label">Note <span className="text-red-600">*</span></label>
              <textarea className="input min-h-28" name="note" required />
            </div>
            <button className="btn-primary w-full">Save transaction</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
