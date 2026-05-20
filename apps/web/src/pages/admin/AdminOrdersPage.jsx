import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminOrderById, getAdminOrders, getEventSeatMap } from "../../api/adminApi";
import AdminOrderDetailModal from "../../components/admin/AdminOrderDetailModal";
import AdminOrderFilters from "../../components/admin/AdminOrderFilters";
import AdminOrderTable from "../../components/admin/AdminOrderTable";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import Pagination from "../../components/common/Pagination";
import { buildAdminOrderQuery, normalizeAdminOrder, normalizeAdminOrdersPayload } from "../../utils/adminOrderMappers";
import { applySeatDisplayLabelToSeat, buildSeatDisplayLabelLookup } from "../../utils/seatDisplayLabels";
import { getSeatDisplayLabel, normalizeSeatMap } from "../../utils/seatMappers";

function getFiltersFromParams(searchParams) {
  return {
    status: searchParams.get("status") || "",
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
  };
}

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedFilters = useMemo(() => getFiltersFromParams(searchParams), [searchParams]);
  const [formFilters, setFormFilters] = useState(appliedFilters);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailModal, setDetailModal] = useState({ open: false, order: null });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await getAdminOrders(buildAdminOrderQuery(appliedFilters));
      const normalized = normalizeAdminOrdersPayload(payload);
      setOrders(normalized.items);
      setPagination(normalized.pagination);
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
    loadOrders();
  }, [loadOrders]);

  function updateSearchParams(nextValues) {
    const nextParams = new URLSearchParams();
    if (nextValues.status) {
      nextParams.set("status", nextValues.status);
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
    setFormFilters({ status: "", page: 1, limit: 20 });
    setSearchParams(new URLSearchParams());
  }

  function handlePageChange(page) {
    updateSearchParams({ ...appliedFilters, page });
  }

  async function openOrderDetail(order) {
    setDetailModal({ open: true, order });
    setDetailLoading(true);
    setDetailError("");

    try {
      const payload = await getAdminOrderById(order.id);
      let normalizedOrder = normalizeAdminOrder(payload);

      if (normalizedOrder.eventId) {
        try {
          const seatMapPayload = await getEventSeatMap(normalizedOrder.eventId);
          const normalizedMap = normalizeSeatMap(seatMapPayload);
          normalizedOrder = applySeatMapDisplayLabelsToAdminOrder(
            normalizedOrder,
            buildSeatDisplayLabelLookup(normalizedMap.sections),
          );
        } catch {
          // Order detail can still render with local seat labels if the map is unavailable.
        }
      }

      setDetailModal({ open: true, order: normalizedOrder });
    } catch (apiError) {
      setDetailError(apiError.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeOrderDetail() {
    setDetailModal({ open: false, order: null });
    setDetailError("");
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        kicker="Sold ticket management"
        title="Orders"
        subtitle="Review customer orders, payment state, seats, and issued ticket records from the admin order API."
      />

      <AdminOrderFilters
        values={formFilters}
        onChange={handleFilterChange}
        onSubmit={handleFilterSubmit}
        onReset={handleResetFilters}
        loading={loading}
      />

      {error ? (
        <ErrorState title="Orders could not load" message={error} action={<Button onClick={loadOrders}>Retry</Button>} />
      ) : null}

      {loading ? (
        <LoadingState title="Loading orders" message="Fetching admin order and sold-ticket records." />
      ) : (
        <AdminOrderTable
          orders={orders}
          onView={openOrderDetail}
          footer={<Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
        />
      )}

      <AdminOrderDetailModal
        isOpen={detailModal.open}
        order={detailModal.order}
        loading={detailLoading}
        error={detailError}
        onClose={closeOrderDetail}
      />
    </div>
  );
}

function applySeatMapDisplayLabelsToAdminOrder(order, lookup) {
  if (!lookup?.size) {
    return order;
  }

  const items = order.items.map((item) => {
    const seat = applySeatDisplayLabelToSeat(item.seat, lookup);
    const ticket = item.ticket
      ? {
          ...item.ticket,
          seat: applySeatDisplayLabelToSeat(item.ticket.seat, lookup),
        }
      : item.ticket;

    return {
      ...item,
      seat,
      ticket,
      seatLabel: seat ? getSeatDisplayLabel(seat) : item.seatLabel,
    };
  });

  return {
    ...order,
    items,
    tickets: order.tickets.map((ticket) => ({
      ...ticket,
      seat: applySeatDisplayLabelToSeat(ticket.seat, lookup),
    })),
  };
}
