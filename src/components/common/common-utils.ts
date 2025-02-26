import { AnchorError } from "@coral-xyz/anchor";

export const unixTimeStamp = (date: Date) => {
  return Math.floor(new Date(date).getTime() / 1000);
};
export const ErrorMessage = (error: AnchorError | unknown) => {
  if (error instanceof Error) return error.message;
  if (error instanceof AnchorError) return error.error.errorMessage;
  else return "Something went wrong !";
};
