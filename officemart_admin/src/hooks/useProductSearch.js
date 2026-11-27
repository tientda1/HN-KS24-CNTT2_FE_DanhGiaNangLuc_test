import { useCallback, useEffect, useState } from 'react';
import api from '../api/axiosClient';

export default function useProductSearch({
  q = '',
  category = '',
  status = '',
  page = 1,
  limit = 10,
} = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadedPage, setLoadedPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const keyword = q.trim();

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/products', {
          params: {
            q: keyword || undefined,
            category: category || undefined,
            status: status || undefined,
            page,
            limit,
          },
          signal: controller.signal,
        });
        if (!active) return;
        setData(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        setLoadedPage(page);
      } catch (err) {
        if (!active || err.code === 'ERR_CANCELED') return;
        setData([]);
        setTotal(0);
        setLoadedPage(page);
        setError(err.response?.data?.message || 'Không thể tải danh sách sản phẩm');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [keyword, category, status, page, limit, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, total, loadedPage, loading, error, refresh };
}
