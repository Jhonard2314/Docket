"use client";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  Tags,
  Search,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { useUser } from "@/components/layout/workspace-shell";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api-client";
import {
  ROLES,
  type AdminUser,
  type NamedRef,
  type ListResponse,
} from "@/lib/contracts";
import { ErrorMessage, Loading, Modal, Empty } from "@/components/ui/shared";
import { initials, dateLabel } from "@/lib/utils";
type Kind = "users" | "departments" | "categories";
export default function Management({ kind }: { kind: Kind }) {
  const user = useUser();
  const endpoint = kind === "categories" ? "/categories" : `/admin/${kind}`;
  const result = useResource<ListResponse<AdminUser & NamedRef>>(
    `${endpoint}?pageSize=100`,
  );
  const deps = useResource<ListResponse<NamedRef>>(
    "/admin/departments?pageSize=100",
  );
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | "password" | null>(null);
  const [selected, setSelected] = useState<(AdminUser & NamedRef) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [deptId, setDeptId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const label =
    kind === "users"
      ? "team member"
      : kind === "departments"
        ? "department"
        : "category";
  const title =
    kind === "users"
      ? "Team members"
      : kind === "departments"
        ? "Departments"
        : "Categories";
  const Icon =
    kind === "users" ? Users : kind === "departments" ? Building2 : Tags;
  function open(action: typeof modal, item: typeof selected = null) {
    setSelected(item);
    setRole(item?.role || "EMPLOYEE");
    setDeptId(item?.department?.id || "");
    setNewPassword("");
    setShowPassword(false);
    setError("");
    setModal(action);
  }
  async function changePassword() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/users/${selected.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword }),
      });
      setModal(null);
      setNewPassword("");
      alert("Password changed successfully!");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (modal === "delete")
        await api(`${endpoint}/${selected!.id}`, { method: "DELETE" });
      else {
        const values = Object.fromEntries(new FormData(e!.currentTarget));
        const body =
          kind === "users"
            ? { 
                ...values, 
                isActive: values.isActive !== "false",
                // If role is ADMIN, set departmentId to null
                departmentId: role === "ADMIN" ? null : values.departmentId
              }
            : values;
        await api(modal === "edit" ? `${endpoint}/${selected!.id}` : endpoint, {
          method: modal === "edit" ? "PATCH" : "POST",
          body: JSON.stringify(body),
        });
      }
      setModal(null);
      result.refresh();
      deps.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (user.role !== "ADMIN")
    return (
      <Empty
        title="Administrator access required"
        description="Contact your workspace administrator to manage team settings."
      />
    );
  const items = result.data?.data.filter((item) =>
    `${item.name} ${item.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE MANAGEMENT</div>
          <h1>
            {title}
            <span className="greeting-dot">.</span>
          </h1>
          <p>
            {kind === "users"
              ? "The people behind the work. Manage accounts and workspace access."
              : kind === "departments"
                ? "Give every team a home for their documents."
                : "Simple labels that keep your document library organized."}
          </p>
        </div>
        <button className="button primary" onClick={() => open("create")}>
          <Plus size={17} />
          Add {label}
        </button>
      </div>
      <ErrorMessage message={result.error} />
      <div className="panel">
        <div className="library-heading">
          <h2>
            <Icon size={19} />
            {title}
            <span className="count-badge">
              {result.data?.pagination.total || 0}
            </span>
          </h2>
          <label className="search-field compact">
            <Search size={17} />
            <input
              aria-label={`Search ${title}`}
              placeholder={`Search ${title.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {result.loading ? (
          <Loading />
        ) : !items?.length ? (
          <Empty
            title="Nothing here yet"
            description={`Add a ${label} or try a different search.`}
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{kind === "users" ? "Team member" : "Name"}</th>
                  {kind === "users" ? (
                    <>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                    </>
                  ) : (
                    <th>Organization</th>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="member-cell">
                        <span className="avatar">
                          {kind === "users" ? (
                            initials(item.name)
                          ) : (
                            <Icon size={19} />
                          )}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {kind === "users"
                              ? item.email
                              : `Workspace ${label}`}
                          </small>
                        </div>
                      </div>
                    </td>
                    {kind === "users" ? (
                      <>
                        <td>
                          {ROLES.find((r) => r.value === item.role)?.label}
                        </td>
                        <td>{item.department?.name || "All departments"}</td>
                        <td>
                          <span
                            className={
                              item.isActive ? "ready-badge" : "inactive-badge"
                            }
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="muted">Shared workspace</td>
                    )}
                    <td>
                      <div className="row-actions">
                        {kind === "users" && (
                          <button
                            className="icon-button"
                            onClick={() => open("password", item)}
                            aria-label={`Change password for ${item.name}`}
                            title="Change password"
                          >
                            <LockKeyhole size={16} />
                          </button>
                        )}
                        <button
                          className="icon-button"
                          onClick={() => open("edit", item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        {kind === "users" ? (
                          // Only show delete for users who aren't the system administrator
                          item.email !== "admin@docket.local" && (
                            <button
                              className="icon-button"
                              onClick={() => open("delete", item)}
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )
                        ) : (
                          <button
                            className="icon-button"
                            onClick={() => open("delete", item)}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <Modal
          title={`${modal === "create" ? "Add" : modal === "edit" ? "Edit" : modal === "password" ? "Change password" : "Delete"} ${label}`}
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <ErrorMessage message={error} />
          {modal === "password" ? (
            <>
              <p className="dialog-description">
                Change password for <strong>{selected?.name}</strong> ({selected?.email})
              </p>
              <fieldset disabled={busy}>
                <label>
                  New password
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      minLength={8}
                      maxLength={256}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small className="muted">
                    At least 8 characters. User will need to use this new password to login.
                  </small>
                </label>
              </fieldset>
              <div className="form-actions">
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  disabled={busy || newPassword.length < 8}
                  onClick={changePassword}
                >
                  {busy ? "Changing…" : "Change password"}
                </button>
              </div>
            </>
          ) : modal === "delete" ? (
            <>
              <p className="dialog-description">
                Delete “{selected?.name}”? Records that are still in use cannot
                be deleted.
              </p>
              <div className="form-actions">
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="button danger"
                  disabled={busy}
                  onClick={() => submit()}
                >
                  {busy ? "Deleting…" : kind === "users" ? "Delete account" : "Delete"}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={submit}>
              <fieldset disabled={busy}>
                <label>
                  {kind === "users" ? "Full name" : "Name"}
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={selected?.name}
                    placeholder={
                      kind === "users"
                        ? "e.g. Jordan Cruz"
                        : kind === "departments"
                          ? "e.g. Marketing"
                          : "e.g. Contracts"
                    }
                  />
                </label>
                {kind === "users" && (
                  <>
                    {modal === "create" && (
                      <>
                        <label>
                          Email address
                          <input
                            type="email"
                            name="email"
                            required
                            autoComplete="off"
                          />
                        </label>
                        <label>
                          Initial password
                          <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            maxLength={256}
                            autoComplete="new-password"
                          />
                          <small className="muted">
                            At least 8 characters.
                          </small>
                        </label>
                      </>
                    )}
                    <label>
                      Role
                      <select
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {role !== "ADMIN" && (
                      <label>
                        Department
                        <select
                          name="departmentId"
                          required
                          value={deptId}
                          onChange={(e) => setDeptId(e.target.value)}
                        >
                          <option value="" disabled>
                            Select department
                          </option>
                          {deps.data?.data.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {modal === "edit" && (
                      <>
                        <label>
                          Account status
                          <select
                            name="isActive"
                            defaultValue={String(selected?.isActive)}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </label>
                        <small className="muted">
                          Joined {dateLabel(selected!.createdAt)}
                        </small>
                      </>
                    )}
                  </>
                )}
              </fieldset>
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal === "create"
                      ? `Create ${label}`
                      : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
