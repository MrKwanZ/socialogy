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
import type { FormState, SignupFormPayload } from '../../types/form';
import Auth from './Auth';

interface SignupProps {
  onSignup: (event: FormEvent, authData: SignupFormPayload) => void;
  loading?: boolean;
}

type SignupFormState = FormState<'email' | 'password' | 'name'>;

const Signup = ({ onSignup, loading }: SignupProps) => {
  const [signupForm, setSignupForm] = useState<SignupFormState>({
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
    name: {
      value: '',
      valid: false,
      touched: false,
      errorMessage: '',
      label: 'name',
      validators: [pleaseEnterRule('name')]
    },
    formIsValid: false
  });

  const inputChangeHandler = (
    input: keyof Omit<SignupFormState, 'formIsValid'>,
    value: string
  ) => {
    setSignupForm((prevState) => ({
      ...prevState,
      [input]: {
        ...prevState[input],
        value
      }
    }));
  };

  const inputBlurHandler = (input: keyof Omit<SignupFormState, 'formIsValid'>) => {
    setSignupForm((prevState) => {
      const updatedField = validateAndTouchField(prevState[input]);
      const email = input === 'email' ? updatedField : prevState.email;
      const password = input === 'password' ? updatedField : prevState.password;
      const name = input === 'name' ? updatedField : prevState.name;

      return {
        ...prevState,
        [input]: updatedField,
        formIsValid: areFieldsValid([email, password, name])
      };
    });
  };

  const submitHandler = (event: FormEvent) => {
    event.preventDefault();

    const email = validateAndTouchField(signupForm.email);
    const password = validateAndTouchField(signupForm.password);
    const name = validateAndTouchField(signupForm.name);
    const formIsValid = areFieldsValid([email, password, name]);

    const validatedForm: SignupFormState = {
      ...signupForm,
      email,
      password,
      name,
      formIsValid
    };

    setSignupForm(validatedForm);

    if (!formIsValid) {
      return;
    }

    onSignup(event, { signupForm: validatedForm });
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
            inputChangeHandler(id as keyof Omit<SignupFormState, 'formIsValid'>, value)
          }
          onBlur={() => inputBlurHandler('email')}
          value={signupForm.email.value}
          valid={signupForm.email.valid}
          touched={signupForm.email.touched}
          errorMessage={signupForm.email.errorMessage}
        />
        <Input
          id="name"
          label="Your Name"
          type="text"
          control="input"
          onChange={(id, value) =>
            inputChangeHandler(id as keyof Omit<SignupFormState, 'formIsValid'>, value)
          }
          onBlur={() => inputBlurHandler('name')}
          value={signupForm.name.value}
          valid={signupForm.name.valid}
          touched={signupForm.name.touched}
          errorMessage={signupForm.name.errorMessage}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          control="input"
          onChange={(id, value) =>
            inputChangeHandler(id as keyof Omit<SignupFormState, 'formIsValid'>, value)
          }
          onBlur={() => inputBlurHandler('password')}
          value={signupForm.password.value}
          valid={signupForm.password.valid}
          touched={signupForm.password.touched}
          errorMessage={signupForm.password.errorMessage}
        />
        <Button design="raised" type="submit" loading={loading}>
          Signup
        </Button>
      </form>
    </Auth>
  );
};

export default Signup;
