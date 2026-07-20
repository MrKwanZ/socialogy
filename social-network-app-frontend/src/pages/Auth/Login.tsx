import type { FormEvent } from 'react';
import { useState } from 'react';

import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import {
  pleaseEnterRule,
  lengthRules,
  emailRule
} from '../../util/validators';
import {
  validateAndTouchField,
  areFieldsValid
} from '../../util/formValidation';
import type { FormState, LoginCredentials } from '../../types/form';
import Auth from './Auth';

interface LoginProps {
  onLogin: (event: FormEvent, authData: LoginCredentials) => void;
  loading?: boolean;
}

type LoginFormState = FormState<'email' | 'password'>;

const Login = ({ onLogin, loading }: LoginProps) => {
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: {
      value: '',
      valid: false,
      touched: false,
      errorMessage: '',
      label: 'email',
      validators: [pleaseEnterRule('email'), emailRule()]
    },
    password: {
      value: '',
      valid: false,
      touched: false,
      errorMessage: '',
      label: 'password',
      validators: [pleaseEnterRule('password'), ...lengthRules({ min: 5 })]
    },
    formIsValid: false
  });

  const inputChangeHandler = (
    input: keyof Omit<LoginFormState, 'formIsValid'>,
    value: string
  ) => {
    setLoginForm((prevState) => ({
      ...prevState,
      [input]: {
        ...prevState[input],
        value
      }
    }));
  };

  const inputBlurHandler = (input: keyof Omit<LoginFormState, 'formIsValid'>) => {
    setLoginForm((prevState) => {
      const updatedField = validateAndTouchField(prevState[input]);
      const email = input === 'email' ? updatedField : prevState.email;
      const password = input === 'password' ? updatedField : prevState.password;

      return {
        ...prevState,
        [input]: updatedField,
        formIsValid: areFieldsValid([email, password])
      };
    });
  };

  const submitHandler = (event: FormEvent) => {
    event.preventDefault();

    const email = validateAndTouchField(loginForm.email);
    const password = validateAndTouchField(loginForm.password);
    const formIsValid = areFieldsValid([email, password]);

    setLoginForm({
      ...loginForm,
      email,
      password,
      formIsValid
    });

    if (!formIsValid) {
      return;
    }

    onLogin(event, {
      email: email.value,
      password: password.value
    });
  };

  return (
    <Auth>
      <form onSubmit={submitHandler}>
        <Input
          id="email"
          label="Your E-Mail"
          type="email"
          control="input"
          onChange={(id, value) =>
            inputChangeHandler(id as keyof Omit<LoginFormState, 'formIsValid'>, value)
          }
          onBlur={() => inputBlurHandler('email')}
          value={loginForm.email.value}
          valid={loginForm.email.valid}
          touched={loginForm.email.touched}
          errorMessage={loginForm.email.errorMessage}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          control="input"
          onChange={(id, value) =>
            inputChangeHandler(id as keyof Omit<LoginFormState, 'formIsValid'>, value)
          }
          onBlur={() => inputBlurHandler('password')}
          value={loginForm.password.value}
          valid={loginForm.password.valid}
          touched={loginForm.password.touched}
          errorMessage={loginForm.password.errorMessage}
        />
        <Button design="raised" type="submit" loading={loading}>
          Login
        </Button>
      </form>
    </Auth>
  );
};

export default Login;
