import type { InputBlurHandler, InputChangeHandler } from '../../../types/form';

import './Input.css';

interface InputProps {
  control: 'input' | 'textarea';
  id: string;
  label?: string;
  valid: boolean;
  touched: boolean;
  errorMessage?: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  rows?: number;
  onChange: InputChangeHandler;
  onBlur: InputBlurHandler;
}

const Input = ({
  control,
  id,
  label,
  valid,
  touched,
  errorMessage,
  value,
  required,
  placeholder,
  type,
  rows,
  onChange,
  onBlur
}: InputProps) => {
  const showError = touched && !valid && errorMessage;

  return (
    <div className="input">
      {label && <label htmlFor={id}>{label}</label>}
      {control === 'input' && (
        <input
          className={[
            !valid ? 'invalid' : 'valid',
            touched ? 'touched' : 'untouched'
          ].join(' ')}
          type={type}
          id={id}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(id, e.target.value, e.target.files)}
          onBlur={onBlur}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
        />
      )}
      {control === 'textarea' && (
        <textarea
          className={[
            !valid ? 'invalid' : 'valid',
            touched ? 'touched' : 'untouched'
          ].join(' ')}
          id={id}
          rows={rows}
          required={required}
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          onBlur={onBlur}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? `${id}-error` : undefined}
        />
      )}
      {showError && (
        <p className="input__error" id={`${id}-error`}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;
