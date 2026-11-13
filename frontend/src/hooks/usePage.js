"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function usePage(endpoint, filters = {}, revision = 0) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");

    api.getPage(endpoint, { page, pageSize, ...JSON.parse(filterKey) })
      .then(data => {
        if (!current) return;
        if (data.pagination?.totalPages && page > data.pagination.totalPages) {
          setPage(data.pagination.totalPages);
          return;
        }
        setResult(data);
      })
      .catch(error => { if (current) setError(error.message); })
      .finally(() => { if (current) setLoading(false); });

    return () => { current = false; };
  }, [endpoint, page, pageSize, filterKey, revision]);

  return {
    result, error, loading, page, pageSize,
    onPageChange: setPage,
    onPageSizeChange: value => {
      setPageSize(value);
      setPage(1);
    },
    ...result?.pagination,
  };
}
