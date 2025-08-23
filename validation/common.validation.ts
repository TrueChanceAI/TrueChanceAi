import * as yup from "yup";

export const AddressValidationSchema = yup.object().shape({
  address: yup
    .string()
    .min(10, "Address must be at least 10 characters")
    .required("Address is required"),
  city: yup
    .string()
    .min(2, "City must be at least 2 characters")
    .required("City is required"),
  country: yup
    .string()
    .min(2, "Country must be at least 2 characters")
    .required("Country is required"),
  zip: yup
    .string()
    .min(3, "ZIP code must be at least 3 characters")
    .max(10, "ZIP code must be at most 10 characters")
    .required("ZIP code is required"),
});
