import { useQuery } from "@tanstack/react-query";
import { getMeService } from "@/services/me";
import { getToken } from "@/lib/token";
import { queryRetry } from "@/lib/api/client";

export const useGetMe = () => {
  const token = getToken();

  const { data, error, isError, isPending, isSuccess } = useQuery({
    queryKey: ["me"],
    queryFn: getMeService,
    enabled: !!token,
    retry: queryRetry,
  });

  return {
    me: data?.user,
    error,
    isError,
    isLoading: isPending,
    isSuccess,
  };
};
