import { useState, useEffect } from 'react';
import { ContributionDay, ContributionSummary } from '@/types/contribution';

interface UseContributionsOptions {
  year: number;
}

interface UseContributionsResult {
  contributions: ContributionDay[];
  summary: ContributionSummary | null;
  isLoading: boolean;
  error: string | null;
}

export function useContributions({ year }: UseContributionsOptions): UseContributionsResult {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [contributionsRes, summaryRes] = await Promise.all([
          fetch(`/api/contributions?year=${year}`),
          fetch(`/api/contributions/summary?year=${year}`)
        ]);

        if (!contributionsRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch contributions data');
        }

        const contributionsData = await contributionsRes.json();
        const summaryData = await summaryRes.json();

        if (contributionsData.code !== '0') {
          throw new Error(contributionsData.message || 'Failed to fetch contributions');
        }

        if (summaryData.code !== '0') {
          throw new Error(summaryData.message || 'Failed to fetch summary');
        }

        setContributions(contributionsData.result || []);
        setSummary(summaryData.result || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setContributions([]);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [year]);

  return {
    contributions,
    summary,
    isLoading,
    error
  };
} 