import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/Feed';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import { graphqlFetch } from './util/graphql';
import { getGraphqlErrorMessage } from './util/graphqlErrors';
import type { AuthData } from './types/graphql';
import type { LoginCredentials, SignupFormPayload } from './types/form';
import './App.css';

const App = () => {
  const navigate = useNavigate();
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showBackdrop, setShowBackdrop] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logoutHandler = useCallback(() => {
    setIsAuth(false);
    setToken(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('expiryDate');
    localStorage.removeItem('userId');
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const setAutoLogout = useCallback(
    (milliseconds: number) => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      logoutTimerRef.current = setTimeout(() => {
        logoutHandler();
      }, milliseconds);
    },
    [logoutHandler]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const expiryDate = localStorage.getItem('expiryDate');
    if (!storedToken || !expiryDate) {
      return;
    }
    if (new Date(expiryDate) <= new Date()) {
      logoutHandler();
      return;
    }
    const storedUserId = localStorage.getItem('userId');
    const remainingMilliseconds =
      new Date(expiryDate).getTime() - new Date().getTime();
    setIsAuth(true);
    setToken(storedToken);
    setUserId(storedUserId);
    setAutoLogout(remainingMilliseconds);

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [logoutHandler, setAutoLogout]);

  const mobileNavHandler = (isOpen: boolean) => {
    setShowMobileNav(isOpen);
    setShowBackdrop(isOpen);
  };

  const backdropClickHandler = () => {
    setShowBackdrop(false);
    setShowMobileNav(false);
    setError(null);
  };

  const loginHandler = (event: FormEvent, authData: LoginCredentials) => {
    event.preventDefault();

    const email = authData.email.trim().toLowerCase();
    const password = authData.password;

    setAuthLoading(true);
    graphqlFetch<{ login: AuthData }>(
      `query UserLogin($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          userId
        }
      }`,
      {
        email,
        password
      }
    )
      .then((resData) => {
        if (resData.errors) {
          throw new Error(getGraphqlErrorMessage(resData.errors, 'login'));
        }

        const loginData = resData.data?.login;
        if (!loginData?.token || !loginData.userId) {
          throw new Error('Login failed. Please try again!');
        }

        setIsAuth(true);
        setToken(loginData.token);
        setAuthLoading(false);
        setUserId(loginData.userId);
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('userId', loginData.userId);
        const remainingMilliseconds = 60 * 60 * 1000;
        const newExpiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        );
        localStorage.setItem('expiryDate', newExpiryDate.toISOString());
        setAutoLogout(remainingMilliseconds);
      })
      .catch((err: Error) => {
        console.log(err);
        setIsAuth(false);
        setAuthLoading(false);
        setError(err);
      });
  };

  const signupHandler = (event: FormEvent, authData: SignupFormPayload) => {
    event.preventDefault();
    setAuthLoading(true);

    const email = authData.signupForm.email.value.trim().toLowerCase();
    const name = authData.signupForm.name.value.trim();
    const password = authData.signupForm.password.value;

    graphqlFetch<{ createUser: { _id: string; email: string } }>(
      `mutation CreateNewUser($email: String!, $name: String!, $password: String!) {
        createUser(userInput: {email: $email, name: $name, password: $password}) {
          _id
          email
        }
      }`,
      {
        email,
        name,
        password
      }
    )
      .then((resData) => {
        if (resData.errors) {
          throw new Error(getGraphqlErrorMessage(resData.errors, 'signup'));
        }

        if (!resData.data?.createUser?._id) {
          throw new Error('Signup failed. Please try again!');
        }

        // Sign in immediately so a successful signup lands in the app.
        return graphqlFetch<{ login: AuthData }>(
          `query UserLogin($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
              userId
            }
          }`,
          { email, password }
        );
      })
      .then((resData) => {
        if (!resData) {
          return;
        }
        if (resData.errors) {
          throw new Error(getGraphqlErrorMessage(resData.errors, 'login'));
        }

        const loginData = resData.data?.login;
        if (!loginData?.token || !loginData.userId) {
          throw new Error(
            'Account created, but automatic login failed. Please log in.'
          );
        }

        setIsAuth(true);
        setToken(loginData.token);
        setUserId(loginData.userId);
        setAuthLoading(false);
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('userId', loginData.userId);
        const remainingMilliseconds = 60 * 60 * 1000;
        const newExpiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        );
        localStorage.setItem('expiryDate', newExpiryDate.toISOString());
        setAutoLogout(remainingMilliseconds);
        navigate('/', { replace: true });
      })
      .catch((err: Error) => {
        console.log(err);
        setIsAuth(false);
        setAuthLoading(false);
        setError(err);
      });
  };

  const errorHandler = () => {
    setError(null);
  };

  let routes = (
    <Routes>
      <Route
        path="/"
        element={<LoginPage onLogin={loginHandler} loading={authLoading} />}
      />
      <Route
        path="/signup"
        element={<SignupPage onSignup={signupHandler} loading={authLoading} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isAuth) {
    routes = (
      <Routes>
        <Route path="/" element={<FeedPage userId={userId} token={token} />} />
        <Route path="/:postId" element={<SinglePostPage token={token} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <>
      {showBackdrop && (
        <Backdrop open={showBackdrop} onClick={backdropClickHandler} />
      )}
      <ErrorHandler error={error} onHandle={errorHandler} />
      <Layout
        header={
          <Toolbar>
            <MainNavigation
              onOpenMobileNav={() => mobileNavHandler(true)}
              onLogout={logoutHandler}
              isAuth={isAuth}
            />
          </Toolbar>
        }
        mobileNav={
          <MobileNavigation
            open={showMobileNav}
            mobile
            onChooseItem={() => mobileNavHandler(false)}
            onLogout={logoutHandler}
            isAuth={isAuth}
          />
        }
      />
      {routes}
    </>
  );
};

export default App;
