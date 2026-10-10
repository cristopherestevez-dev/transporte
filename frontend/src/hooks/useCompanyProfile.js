"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import api from '@/services/api';

const cache = new Map();
export default function useCompanyProfile() {
  const { user } = useAuth();
  const empresaId = user?.empresaId;
  const [profile, setProfile] = useState(null), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setProfile(null); setError('');
    if (empresaId) {
      if (!cache.has(empresaId)) cache.set(empresaId, api.get('/usuarios/empresa/perfil'));
      cache.get(empresaId).then(data => { if (active) setProfile(data); }).catch(err => { cache.delete(empresaId); if (active) setError(err.message); });
    }
    return () => { active = false; };
  }, [empresaId, revision]);
  useEffect(() => {
    const refresh = () => { cache.delete(empresaId); setRevision(value => value + 1); };
    window.addEventListener('company-logo-changed', refresh);
    return () => window.removeEventListener('company-logo-changed', refresh);
  }, [empresaId]);
  return { profile, error };
}
