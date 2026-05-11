import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const ANALYTICS_API_BASE = 'http://localhost:8080/analytics';

const fetchJourney = async (orgId, token) => {
  const { data } = await axios.get(`${ANALYTICS_API_BASE}/${orgId}/journey`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

const fetchAtRisk = async (orgId, token) => {
  const { data } = await axios.get(`${ANALYTICS_API_BASE}/${orgId}/at-risk`, {
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
