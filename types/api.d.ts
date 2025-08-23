export interface IAPIResponse {
  statusCode: number;
  message: string;
  success: boolean;
}

export interface IAPIError {
  name: string;
  message: string;
  stack?: string;

  response:
    | any
    | {
        data: {
          message: string;
          success: boolean;
          error: null | any;
        };
      };
}
