export interface ValidationRule {
  test: (value: string | File) => boolean;
  message: string | ((fieldLabel: string) => string);
}

export interface LengthConfig {
  min?: number;
  max?: number;
}

function ruleMessage(
  rule: ValidationRule,
  fieldLabel: string
): string {
  return typeof rule.message === 'function'
    ? rule.message(fieldLabel)
    : rule.message;
}

export function validateField(
  value: string | File,
  rules: ValidationRule[],
  fieldLabel: string
): { valid: boolean; errorMessage: string } {
  for (const rule of rules) {
    if (!rule.test(value)) {
      return { valid: false, errorMessage: ruleMessage(rule, fieldLabel) };
    }
  }
  return { valid: true, errorMessage: '' };
}

export const requiredRule =
  (fieldName: string): ValidationRule => ({
    test: (value) => {
      if (value instanceof File) {
        return true;
      }
      return String(value).trim() !== '';
    },
    message: `${fieldName} should not be empty`
  });

export const pleaseEnterRule =
  (fieldName: string): ValidationRule => ({
    test: (value) => {
      if (value instanceof File) {
        return true;
      }
      return String(value).trim() !== '';
    },
    message: `Please enter your ${fieldName}`
  });

export const emailRule = (): ValidationRule => ({
  test: (value) =>
    typeof value === 'string' &&
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(
      value
    ),
  message: 'Please enter a valid email address'
});

export const minLengthRule =
  (min: number): ValidationRule => ({
    test: (value) =>
      typeof value === 'string' && value.trim().length >= min,
    message: (fieldLabel) =>
      `Please write a ${fieldLabel} with at least ${min} characters!`
  });

export const maxLengthRule =
  (max: number): ValidationRule => ({
    test: (value) =>
      typeof value === 'string' && value.trim().length <= max,
    message: (fieldLabel) =>
      `Please write a ${fieldLabel} within ${max} characters!`
  });

export const lengthRules = (config: LengthConfig): ValidationRule[] => {
  const rules: ValidationRule[] = [];
  if (config.min) {
    rules.push(minLengthRule(config.min));
  }
  if (config.max) {
    rules.push(maxLengthRule(config.max));
  }
  return rules;
};
