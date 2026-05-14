import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const ANALYTICS_API_BASE = '/api/v1/analytics';

const fetchJourney = async (orgId, token) => {
  const { data } = await axios.get(`${ANALYTICS_API_BASE}/journey`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchAtRisk = async (orgId, token) => {
  const { data } = await axios.get(`${ANALYTICS_API_BASE}/at-risk`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

export const useJourney = (orgId, token) => {
  return useQuery({
    queryKey: ['journey', orgId],
    queryFn: () => fetchJourney(orgId, token),
    enabled: !!orgId && !!token,
  });
};

export const useAtRisk = (orgId, token) => {
  return useQuery({
    queryKey: ['at-risk', orgId],
    queryFn: () => fetchAtRisk(orgId, token),
    enabled: !!orgId && !!token,
  });
};
