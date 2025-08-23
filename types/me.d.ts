import { IAPIResponse } from "./api";

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isEmailVerified: boolean;
}

export interface IMeResponse extends IAPIResponse {
  user: IUser;
}

export type TGetMeService = () => Promise<IMeResponse>;
