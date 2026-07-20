import type { FormField } from '../types/form';
import { validateField } from './validators';

export function validateFormField<T extends string | File>(field: FormField<T>) {
  return validateField(field.value, field.validators, field.label);
}

export function validateAndTouchField<T extends string | File>(
  field: FormField<T>
): FormField<T> {
  const { valid, errorMessage } = validateFormField(field);
  return {
    ...field,
    valid,
    errorMessage,
    touched: true
  };
}

export function areFieldsValid(fields: FormField<string | File>[]): boolean {
  return fields.every((field) => field.valid);
}
