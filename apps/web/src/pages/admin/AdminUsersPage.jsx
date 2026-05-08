import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  assignAdminUserRoles,
  deleteAdminUser,
  getAdminRoles,
  getAdminUserById,
  getAdminUsers,
} from "../../api/adminApi";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminUserDetailModal from "../../components/admin/AdminUserDetailModal";
import AdminUserFilters from "../../components/admin/AdminUserFilters";
import AdminUserRoleEditor from "../../components/admin/AdminUserRoleEditor";
import AdminUserTable from "../../components/admin/AdminUserTable";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Pagination from "../../components/common/Pagination";
import { getCollectionItems, getEntityId, getPagination } from "../../utils/eventMappers";

function getFiltersFromParams(searchParams) {
  return {
    keyword: searchParams.get("keyword") || "",
    role: searchParams.get("role") || "",
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
  };
}

function normalizeRole(role = {}) {
  return {
    ...role,
    id: String(getEntityId(role) || ""),
    name: role.name || String(role),
  };
}

function normalizeUser(user = {}) {
  return {
    ...user,
    id: String(getEntityId(user) || ""),
    username: user.username || "",
    email: user.email || "",
    fullName: user.fullName || "",
    avatarUrl: user.avatarUrl || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth || "",
    roles: getCollectionItems(user.roles).map(normalizeRole),
  };
}

function normalizeUsersPayload(payload = {}) {
  return {
    items: getCollectionItems(payload).map(normalizeUser),
    pagination: getPagination(payload),
  };
}

function buildUserQuery(values = {}) {
  return Object.fromEntries(
    Object.entries({
      keyword: values.keyword?.trim() || undefined,
      role: values.role || undefined,
      page: values.page || 1,
      limit: values.limit || 20,
    }).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedFilters = useMemo(() => getFiltersFromParams(searchParams), [searchParams]);
  const [formFilters, setFormFilters] = useState(appliedFilters);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailModal, setDetailModal] = useState({ open: false, user: null });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [roleEditor, setRoleEditor] = useState({ open: false, user: null });
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [usersPayload, rolesPayload] = await Promise.all([
        getAdminUsers(buildUserQuery(appliedFilters)),
        getAdminRoles(),
      ]);
      const normalized = normalizeUsersPayload(usersPayload);
      setUsers(normalized.items);
      setPagination(normalized.pagination);
      setRoles(getCollectionItems(rolesPayload).map(normalizeRole));
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    setFormFilters(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function updateSearchParams(nextValues) {
    const nextParams = new URLSearchParams();
    if (nextValues.keyword) {
      nextParams.set("keyword", nextValues.keyword);
    }
    if (nextValues.role) {
      nextParams.set("role", nextValues.role);
    }
    if (nextValues.page && nextValues.page > 1) {
      nextParams.set("page", String(nextValues.page));
    }
    if (nextValues.limit && nextValues.limit !== 20) {
      nextParams.set("limit", String(nextValues.limit));
    }
    setSearchParams(nextParams);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFormFilters((current) => ({ ...current, [name]: value }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    updateSearchParams({ ...formFilters, page: 1 });
  }

  function handleResetFilters() {
    setFormFilters({ keyword: "", role: "", page: 1, limit: 20 });
    setSearchParams(new URLSearchParams());
  }

  async function openUserDetail(user) {
    setDetailModal({ open: true, user });
    setDetailLoading(true);
    setDetailError("");

    try {
      const payload = await getAdminUserById(user.id);
      setDetailModal({ open: true, user: normalizeUser(payload) });
    } catch (apiError) {
      setDetailError(apiError.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAssignRoles(roleIds) {
    if (!roleEditor.user) {
      return;
    }

    setRoleLoading(true);
    setRoleError("");

    try {
      await assignAdminUserRoles(roleEditor.user.id, { roleIds });
      setRoleEditor({ open: false, user: null });
      await loadUsers();
    } catch (apiError) {
      setRoleError(apiError.message);
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await deleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers();
    } catch (apiError) {
      setDeleteError(apiError.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        kicker="User management"
        title="Users"
        subtitle="Search accounts, inspect user details, assign roles, and delete accounts when backend safety rules allow it."
      />

      <AdminUserFilters
        values={formFilters}
        roles={roles}
        loading={loading}
        onChange={handleFilterChange}
        onSubmit={handleFilterSubmit}
        onReset={handleResetFilters}
      />

      {error ? <ErrorState title="Users could not load" message={error} action={<Button onClick={loadUsers}>Retry</Button>} /> : null}

      {loading ? (
        <LoadingState title="Loading users" message="Fetching admin user records." />
      ) : (
        <AdminUserTable
          users={users}
          onView={openUserDetail}
          onEditRoles={(user) => {
            setRoleError("");
            setRoleEditor({ open: true, user });
          }}
          onDelete={(user) => {
            setDeleteError("");
            setDeleteTarget(user);
          }}
          footer={<Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(page) => updateSearchParams({ ...appliedFilters, page })} />}
        />
      )}

      <AdminUserDetailModal
        isOpen={detailModal.open}
        user={detailModal.user}
        loading={detailLoading}
        error={detailError}
        onClose={() => setDetailModal({ open: false, user: null })}
      />

      <AdminUserRoleEditor
        isOpen={roleEditor.open}
        user={roleEditor.user}
        roles={roles}
        loading={roleLoading}
        error={roleError}
        onClose={() => setRoleEditor({ open: false, user: null })}
        onSubmit={handleAssignRoles}
      />

      <AdminConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete user"
        message={`Delete ${deleteTarget?.fullName || deleteTarget?.username || deleteTarget?.email || "this user"}? The backend will block deletion for protected admin or ticket/order accounts.`}
        confirmLabel="Delete user"
        confirmVariant="danger"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
