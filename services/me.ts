import clientApi from "@/lib/api/client";
import { TGetMeService } from "@/types/me";

export const getMeService: TGetMeService = async () => {
  const { data } = await clientApi.get("/me");

  return data;
};
