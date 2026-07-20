import type { InputBlurHandler, InputChangeHandler } from '../../../types/form';

import './Input.css';

interface FilePickerProps {
  id: string;
  label: string;
  valid: boolean;
  touched: boolean;
  errorMessage?: string;
  onChange: InputChangeHandler;
  onBlur: InputBlurHandler;
}

const FilePicker = ({
  id,
  label,
  valid,
  touched,
  errorMessage,
  onChange,
  onBlur
}: FilePickerProps) => {
  const showError = touched && !valid && errorMessage;

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input
        className={[
          !valid ? 'invalid' : 'valid',
          touched ? 'touched' : 'untouched'
        ].join(' ')}
        type="file"
        id={id}
        onChange={(e) => onChange(id, e.target.value, e.target.files)}
        onBlur={onBlur}
        aria-invalid={showError ? true : undefined}
        aria-describedby={showError ? `${id}-error` : undefined}
      />
      {showError && (
        <p className="input__error" id={`${id}-error`}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default FilePicker;
