import type { ValidationRule } from '../util/validators';

export type InputChangeHandler = (
  id: string,
  value: string,
  files?: FileList | null
) => void;

export type InputBlurHandler = () => void;

export interface FormField<T = string> {
  value: T;
  valid: boolean;
  touched: boolean;
  errorMessage: string;
  label: string;
  validators: ValidationRule[];
}

export type FormState<T extends string> = {
  [K in T]: FormField;
} & {
  formIsValid: boolean;
};

export type PostFormState = {
  title: FormField<string>;
  image: FormField<string | File>;
  content: FormField<string>;
};

export interface SignupFormPayload {
  signupForm: FormState<'email' | 'password' | 'name'>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
