"use client";
import { useState, useEffect } from 'react';
import api from '@/services/api';
export default function usePage(endpoint, filters = {}) {
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(5);
  const [result, setResult] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const key = JSON.stringify(filters);
  useEffect(() => {
    let current = true; setLoading(true); setError('');
    api.getPage(endpoint, { page, pageSize, ...JSON.parse(key) }).then(data => {
      if (!current) return;
      if (data.pagination?.totalPages && page > data.pagination.totalPages) { setPage(data.pagination.totalPages); return; }
      setResult(data);
    }).catch(err => { if (current) setError(err.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [endpoint, page, pageSize, key]);
  return { result, error, loading, page, pageSize, onPageChange: setPage, onPageSizeChange: value => { setPageSize(value); setPage(1); }, ...(result?.pagination || {}) };
}
