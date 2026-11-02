export interface AuthSignUpDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthSignInDto {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface SignInResponseDto extends AuthUserDto {
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface AuthSessionDto extends AuthUserDto {
  accessToken?: string | null;
  refreshToken?: string | null;
}
