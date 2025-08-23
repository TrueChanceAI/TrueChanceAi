import * as yup from "yup";

const PasswordSchema = yup
  .string()
  .required("Password is a required field.") // Error for empty password
  .min(8, "Password must be at least 8 characters long.") // Error for minimum length
  .max(16, "Password must not exceed 16 characters.") // Error for maximum length
  .matches(/[a-z]/, "Password must contain at least one lowercase letter.") // Error for missing lowercase
  .matches(/[A-Z]/, "Password must contain at least one uppercase letter.") // Error for missing uppercase
  .matches(/\d/, "Password must contain at least one number.") // Error for missing number
  .matches(
    /[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]/,
    "Password must contain at least one special character." // Error for missing special character
  );

export const LoginSchema = yup.object().shape({
  // Email validation rules
  email: yup
    .string()
    .required("Email is a required field.") // Error for empty email
    .email("Please enter a valid email address."), // Error for invalid email format

  // Password validation rules with separate error messages
  password: PasswordSchema,
});

export const RegisterSchema = yup.object().shape({
  firstName: yup.string().required("First name is a required field."),
  lastName: yup.string().required("Last name is a required field."),
  email: yup
    .string()
    .required("Email is a required field.")
    .email("Please enter a valid email address."),
  phoneNumber: yup
    .string()
    .required("Phone number is a required field.")
    .matches(/^[1-9]\d{6,14}$/, "Please enter a valid phone number"),
  password: PasswordSchema,
  confirmPassword: yup
    .string()
    .required("Confirm password is a required field.")
    .oneOf([yup.ref("password")], "Passwords must match"),
});
