export interface SignInInputs {
  email: string;
  password: string;
}

export interface RegisterInputs {
  username: string;
  email: string;
  password: string;
}

export interface VerifyEmailInputs {
  email: string;
  code: string;
}

export interface ForgotPasswordInputs {
  email: string;
}

export interface ResetPasswordInputs {
  email: string;
  password: string;
  code: string;
}
