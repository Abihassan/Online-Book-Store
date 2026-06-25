import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';

import { LoadingButton } from '../components/ui/loading-button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SegmentedPasswordInput } from '../components/ui/segmentedpasswordinput';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

import { useAuth } from '../contexts/AuthContext';

import {
  forgotPassword,
} from '../lib/auth';

import {
  validateEmail,
  validatePassword,
  validateName,
} from '../lib/validation';

import { toast } from 'sonner';

type ActiveTab = 'login' | 'register' | 'forgot';

type AuthUser = {
  id?: string;
  name?: string;
  email: string;
  role?: string;
  emailVerified?: boolean;
};

// ─────────────────────────────────────────────────────────────
// Reusable Password Input
// ─────────────────────────────────────────────────────────────
// THIS MUST BE DEFINED HERE, AT MODULE SCOPE — NOT inside the Auth
// component body. This was the actual root cause of the "must click
// before typing every letter" bug:
//
// When a component function is defined INSIDE another component's
// body, React sees a brand-new function reference on every re-render
// of the parent. Since typing a single character into ANY controlled
// input updates state and re-renders Auth, a PasswordInput defined
// inside Auth() was being treated as an entirely new component type
// on every keystroke — so React unmounted the real <input> DOM node
// and mounted a fresh one in its place each time, which destroys
// focus. That's exactly why it felt like clicking was required before
// every single letter: the input was being torn down and rebuilt on
// every keystroke. Defining it here, once, at module scope, means the
// same component instance (and the same underlying <input> element)
// persists across re-renders, so focus is never lost and typing works
// continuously like a normal text field.
//
// `show`/`onToggle` are accepted for backward compatibility with
// existing call sites below but are unused — SegmentedPasswordInput
// manages its own show/hide toggle internally.
const PasswordInput = ({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show?: boolean;
  onToggle?: () => void;
  error?: string;
}) => (
  <SegmentedPasswordInput id={id} value={value} onChange={onChange} error={error} />
);

export const Auth = () => {
  const navigate = useNavigate();

  /**
   * AuthContext ONLY handles application auth state.
   * API/authentication logic stays in auth.ts
   */
  const { login, register } = useAuth();

  // ─────────────────────────────────────────────────────────────
  // UI State
  // ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('login');

  // ─────────────────────────────────────────────────────────────
  // Form State
  // ─────────────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [forgotEmail, setForgotEmail] = useState('');

  // ─────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Forgot Password State
  // ─────────────────────────────────────────────────────────────
  const [forgotSent, setForgotSent] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Password Visibility State
  // ─────────────────────────────────────────────────────────────
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ─────────────────────────────────────────────────────────────
  // Validation Errors
  // ─────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─────────────────────────────────────────────────────────────
  // Login Validation
  // ─────────────────────────────────────────────────────────────
  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};

    if (!loginForm.email) {
      newErrors.loginEmail = 'Email is required';
    } else if (!validateEmail(loginForm.email)) {
      newErrors.loginEmail = 'Please enter a valid email address';
    }

    if (!loginForm.password) {
      newErrors.loginPassword = 'Password is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ─────────────────────────────────────────────────────────────
  // Register Validation
  // ─────────────────────────────────────────────────────────────
  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};

    if (!registerForm.name) {
      newErrors.name = 'Name is required';
    } else if (!validateName(registerForm.name)) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!registerForm.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(registerForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!registerForm.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(
        registerForm.password
      );

      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!registerForm.confirmPassword) {
      newErrors.confirmPassword =
        'Please confirm your password';
    } else if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      newErrors.confirmPassword =
        'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ─────────────────────────────────────────────────────────────
  // Login Handler
  // ─────────────────────────────────────────────────────────────
  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrors({});

    // Defensive validation
    if (!validateLoginForm()) return;

    setLoginLoading(true);

    try {
      /**
       * STEP 1:
       * Authenticate user AND update application auth state
       * in a single call. AuthContext.login() internally calls
       * the API exactly once — do NOT call loginUser() here too,
       * or you will fire two POST /api/auth/login requests and
       * the user state can end up out of sync with the tokens
       * stored by the first request.
       */
      const user = (await login(
        loginForm.email,
        loginForm.password
      )) as AuthUser | null;

      // Defensive null check
      if (!user) {
        toast.error('Invalid email or password');
        return;
      }

      /**
       * STEP 2:
       * Optional security/business checks
       * Easy to extend later
       */

      // Example:
      // if (!user.emailVerified) {
      //   navigate('/verify-email');
      //   return;
      // }

      // Example:
      // if (user.role !== 'admin') {}

      /**
       * STEP 3:
       * Navigate after successful auth
       */
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(
        error?.message ||
          'An error occurred during login'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Register Handler
  // ─────────────────────────────────────────────────────────────
  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrors({});

    if (!validateRegisterForm()) return;

    setRegisterLoading(true);

    try {
      /**
       * STEP 1:
       * Register user AND update application auth state
       * in a single call. AuthContext.register() internally calls
       * the API exactly once — do NOT call registerUser() here too,
       * or you will fire two POST /api/auth/register requests
       * (the second of which will fail with 409 "Email already
       * registered" since the account was already created by
       * the first call).
       */
      const user = (await register(
        registerForm.email,
        registerForm.password,
        registerForm.name
      )) as AuthUser | null;

      // Defensive check
      if (!user) {
        toast.error('Unable to create account');
        return;
      }

      /**
       * STEP 2:
       * Optional onboarding checks
       */

      // Example:
      // if (!user.emailVerified) {
      //   navigate('/verify-email');
      //   return;
      // }

      /**
       * STEP 3:
       * Success feedback
       */
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(
        error?.message ||
          'An error occurred during registration'
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────────────────────
  const handleForgotPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrors({});

    if (!forgotEmail) {
      setErrors({
        forgotEmail: 'Email is required',
      });
      return;
    }

    if (!validateEmail(forgotEmail)) {
      setErrors({
        forgotEmail:
          'Please enter a valid email address',
      });
      return;
    }

    setForgotLoading(true);

    try {
      await forgotPassword(forgotEmail);

      /**
       * Prevent email enumeration attacks
       */
      setForgotSent(true);

      toast.success(
        'Reset link sent! Check your inbox.'
      );
    } catch {
      /**
       * Still show success state for security
       */
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // (PasswordInput moved to module scope below — see comment there
  // for why it HAD to move out of this component body.)
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="h-10 w-10 text-orange-600" />

            <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              BookHaven
            </span>
          </div>

          <p className="text-gray-600">
            Your digital reading companion
          </p>
        </div>

        <Card className="border-orange-200 bg-white/90 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">
              {activeTab === 'forgot'
                ? 'Reset Password'
                : 'Welcome'}
            </CardTitle>

            <CardDescription className="text-gray-600">
              {activeTab === 'forgot'
                ? "Enter your email and we'll send you a reset link"
                : 'Sign in to your account or create a new one'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {activeTab === 'forgot' ? (
              <div>
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setForgotSent(false);
                    setForgotEmail('');
                    setErrors({});
                  }}
                  className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 mb-5 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>

                {forgotSent ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Check your inbox
                    </h3>

                    <p className="text-gray-500 text-sm mb-4">
                      If{' '}
                      <span className="font-medium text-gray-700">
                        {forgotEmail}
                      </span>{' '}
                      is registered, a reset link was
                      sent.
                    </p>

                    <button
                      onClick={() => {
                        setForgotSent(false);
                        setForgotEmail('');
                      }}
                      className="text-sm text-orange-600 hover:underline"
                    >
                      Didn't receive it? Send again
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="forgot-email"
                        className="text-gray-700"
                      >
                        Email address
                      </Label>

                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(
                            e.target.value
                          );
                          setErrors({});
                        }}
                        className="bg-orange-50 border-orange-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-200"
                      />

                      {errors.forgotEmail && (
                        <p className="text-sm text-red-600">
                          {errors.forgotEmail}
                        </p>
                      )}
                    </div>

                    <LoadingButton
                      type="submit"
                      loading={forgotLoading}
                      loadingText="Sending..."
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      Send Reset Link
                    </LoadingButton>
                  </form>
                )}
              </div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as ActiveTab);
                  setErrors({});
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-orange-100">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-gradient-to-r from-orange-500 to-amber-500 data-[state=active]:text-white text-orange-700 transition-colors"
                  >
                    Login
                  </TabsTrigger>

                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-gradient-to-r from-orange-500 to-amber-500 data-[state=active]:text-white text-orange-700 transition-colors"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* LOGIN */}
                <TabsContent value="login">
                  <form
                    onSubmit={handleLogin}
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-email"
                        className="text-gray-700"
                      >
                        Email
                      </Label>

                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => {
                          setLoginForm({
                            ...loginForm,
                            email: e.target.value,
                          });

                          setErrors({
                            ...errors,
                            loginEmail: '',
                          });
                        }}
                        className="bg-orange-50 border-orange-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-200"
                      />

                      {errors.loginEmail && (
                        <p className="text-sm text-red-600">
                          {errors.loginEmail}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="text-gray-700"
                        >
                          Password
                        </Label>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('forgot');
                            setErrors({});
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <PasswordInput
                        id="login-password"
                        value={loginForm.password}
                        onChange={(v) => {
                          setLoginForm({
                            ...loginForm,
                            password: v,
                          });

                          setErrors({
                            ...errors,
                            loginPassword: '',
                          });
                        }}
                        show={showLoginPassword}
                        onToggle={() =>
                          setShowLoginPassword(
                            (p) => !p
                          )
                        }
                        error={errors.loginPassword}
                      />
                    </div>

                    <LoadingButton
                      type="submit"
                      loading={loginLoading}
                      loadingText="Signing in..."
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      Sign In
                    </LoadingButton>
                  </form>
                </TabsContent>

                {/* REGISTER */}
                <TabsContent value="register">
                  <form
                    onSubmit={handleRegister}
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="register-name"
                        className="text-gray-700"
                      >
                        Full Name
                      </Label>

                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerForm.name}
                        onChange={(e) => {
                          setRegisterForm({
                            ...registerForm,
                            name: e.target.value,
                          });

                          setErrors({
                            ...errors,
                            name: '',
                          });
                        }}
                        className="bg-orange-50 border-orange-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-200"
                      />

                      {errors.name && (
                        <p className="text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-email"
                        className="text-gray-700"
                      >
                        Email
                      </Label>

                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerForm.email}
                        onChange={(e) => {
                          setRegisterForm({
                            ...registerForm,
                            email: e.target.value,
                          });

                          setErrors({
                            ...errors,
                            email: '',
                          });
                        }}
                        className="bg-orange-50 border-orange-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-200"
                      />

                      {errors.email && (
                        <p className="text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-password"
                        className="text-gray-700"
                      >
                        Password
                      </Label>

                      <PasswordInput
                        id="register-password"
                        value={registerForm.password}
                        onChange={(v) => {
                          setRegisterForm({
                            ...registerForm,
                            password: v,
                          });

                          setErrors({
                            ...errors,
                            password: '',
                          });
                        }}
                        show={showRegisterPassword}
                        onToggle={() =>
                          setShowRegisterPassword(
                            (p) => !p
                          )
                        }
                        error={errors.password}
                      />

                      <p className="text-xs text-gray-400">
                        Must be 8+ characters with
                        uppercase, lowercase, and number
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-confirm"
                        className="text-gray-700"
                      >
                        Confirm Password
                      </Label>

                      <PasswordInput
                        id="register-confirm"
                        value={
                          registerForm.confirmPassword
                        }
                        onChange={(v) => {
                          setRegisterForm({
                            ...registerForm,
                            confirmPassword: v,
                          });

                          setErrors({
                            ...errors,
                            confirmPassword: '',
                          });
                        }}
                        show={showConfirmPassword}
                        onToggle={() =>
                          setShowConfirmPassword(
                            (p) => !p
                          )
                        }
                        error={
                          errors.confirmPassword
                        }
                      />
                    </div>

                    <LoadingButton
                      type="submit"
                      loading={registerLoading}
                      loadingText="Creating account..."
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      Create Account
                    </LoadingButton>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};