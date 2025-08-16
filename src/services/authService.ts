// src/services/authService.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "@/lib/rate-limit";
import User from "@/models/SecureUser";
import dbConnect from "@/lib/db";
import { 
  AuthTokenPayload, 
  AuthRequest,
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  LogoutRequest,
  AuthResponse, 
  AuthUser,
  SecurityConfig,
  AuthError,
  AuthErrorCodes,
  IUser 
} from "@/types/auth-backend";

export class AuthService {
  private config: SecurityConfig;
  private limiter: ReturnType<typeof rateLimit>;

  constructor() {
    this.config = this.getSecurityConfig();
    this.validateConfig();
    
    // Initialize rate limiter
    this.limiter = rateLimit({
      interval: this.config.rateLimit.windowMs,
      uniqueTokenPerInterval: 500,
    });
  }

  private getSecurityConfig(): SecurityConfig {
    const requiredEnvVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    // Check for required environment variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    return {
      jwt: {
        accessTokenSecret: process.env.JWT_SECRET!,
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
        accessTokenExpiry: process.env.JWT_EXPIRES_IN || "15m",
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        issuer: process.env.JWT_ISSUER || 'expense-tracker',
        audience: process.env.JWT_AUDIENCE || 'expense-tracker-client'
      },
      bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_ROUNDS || "12")
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
        maxAttempts: parseInt(process.env.RATE_LIMIT_MAX || "5"),
        blockDuration: parseInt(process.env.RATE_LIMIT_BLOCK || "3600000") // 1 hour
      },
      account: {
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5"),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || "7200000") // 2 hours
      }
    };
  }

  private validateConfig(): void {
    if (this.config.jwt.accessTokenSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }
    if (this.config.jwt.refreshTokenSecret.length < 32) {
      throw new Error('JWT refresh secret must be at least 32 characters long');
    }
  }

  async checkRateLimit(identifier: string): Promise<void> {
    try {
      await this.limiter.check(this.config.rateLimit.maxAttempts, identifier);
    } catch (error: any) {
      throw new AuthError(
        'Too many requests. Please try again later.',
        AuthErrorCodes.RATE_LIMIT_EXCEEDED,
        429
      );
    }
  }

  private generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload: Omit<AuthTokenPayload, 'type' | 'iat' | 'exp' | 'iss' | 'aud'> = {
      id: user._id,
      email: user.email,
      name: user.name
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.config.jwt.accessTokenSecret,
      { 
        expiresIn: this.config.jwt.accessTokenExpiry,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.config.jwt.refreshTokenSecret,
      { 
        expiresIn: this.config.jwt.refreshTokenExpiry,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = jwt.verify(
        token,
        this.config.jwt.accessTokenSecret,
        {
          issuer: this.config.jwt.issuer,
          audience: this.config.jwt.audience
        }
      ) as AuthTokenPayload;

      if (decoded.type !== 'access') {
        throw new AuthError('Invalid token type', AuthErrorCodes.INVALID_TOKEN);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token has expired', AuthErrorCodes.TOKEN_EXPIRED);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token', AuthErrorCodes.INVALID_TOKEN);
      }
      throw new AuthError('Token verification failed', AuthErrorCodes.INVALID_TOKEN);
    }
  }

  async verifyRefreshToken(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = jwt.verify(
        token,
        this.config.jwt.refreshTokenSecret,
        {
          issuer: this.config.jwt.issuer,
          audience: this.config.jwt.audience
        }
      ) as AuthTokenPayload;

      if (decoded.type !== 'refresh') {
        throw new AuthError('Invalid refresh token', AuthErrorCodes.INVALID_TOKEN);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Refresh token has expired', AuthErrorCodes.REFRESH_TOKEN_EXPIRED);
      }
      throw new AuthError('Invalid refresh token', AuthErrorCodes.INVALID_TOKEN);
    }
  }

  async register(data: RegisterRequest, clientId: string): Promise<AuthResponse> {
    await this.checkRateLimit(clientId);
    await dbConnect();

    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(data.email);
      if (existingUser) {
        throw new AuthError(
          'An account with this email already exists',
          AuthErrorCodes.USER_EXISTS,
          409
        );
      }

      // Create new user
      const user = new User({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        monthlyBudget: 0,
        expenses: []
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Store refresh token (hashed)
      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      user.refreshTokens.push(hashedRefreshToken);
      await user.save();

      return {
        success: true,
        token: accessToken,
        refreshToken,
        user: user.sanitizeForResponse(),
        message: 'Account created successfully',
        expiresIn: this.config.jwt.accessTokenExpiry
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new AuthError(
          'Invalid user data provided',
          AuthErrorCodes.VALIDATION_ERROR,
          400
        );
      }
      if ((error as any).code === 11000) {
        throw new AuthError(
          'An account with this email already exists',
          AuthErrorCodes.USER_EXISTS,
          409
        );
      }
      console.error('Registration error:', error);
      throw new AuthError(
        'Internal server error during registration',
        AuthErrorCodes.INTERNAL_ERROR,
        500
      );
    }
  }

  async login(data: LoginRequest, clientId: string): Promise<AuthResponse> {
    await this.checkRateLimit(clientId);
    await dbConnect();

    try {
      // Find user with password field
      const user = await User.findOne({
        email: data.email.toLowerCase().trim(),
        isActive: true
      }).select('+password +refreshTokens +loginAttempts +lockUntil');

      if (!user) {
        // Don't reveal if user exists or not
        throw new AuthError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS
        );
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw new AuthError(
          'Account temporarily locked due to too many failed login attempts',
          AuthErrorCodes.ACCOUNT_LOCKED,
          423
        );
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(data.password);
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        throw new AuthError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS
        );
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Store refresh token (hashed)
      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Limit refresh tokens to prevent accumulation
      if (user.refreshTokens.length >= 10) {
        user.refreshTokens = user.refreshTokens.slice(-9);
      }
      user.refreshTokens.push(hashedRefreshToken);
      await user.save();

      return {
        success: true,
        token: accessToken,
        refreshToken,
        user: user.sanitizeForResponse(),
        message: 'Login successful',
        expiresIn: this.config.jwt.accessTokenExpiry
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('Login error:', error);
      throw new AuthError(
        'Internal server error during login',
        AuthErrorCodes.INTERNAL_ERROR,
        500
      );
    }
  }

  async refreshAccessToken(refreshToken: string, clientId: string): Promise<AuthResponse> {
    await this.checkRateLimit(clientId);
    await dbConnect();

    try {
      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Hash the refresh token to find it in database
      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Find user and check if refresh token exists
      const user = await User.findOne({
        _id: decoded.id,
        isActive: true,
        refreshTokens: hashedRefreshToken
      }).select('+refreshTokens');

      if (!user) {
        throw new AuthError(
          'Invalid refresh token',
          AuthErrorCodes.INVALID_TOKEN
        );
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      // Replace old refresh token with new one
      const newHashedRefreshToken = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      const tokenIndex = user.refreshTokens.indexOf(hashedRefreshToken);
      if (tokenIndex > -1) {
        user.refreshTokens[tokenIndex] = newHashedRefreshToken;
        await user.save();
      }

      return {
        success: true,
        token: accessToken,
        refreshToken: newRefreshToken,
        user: user.sanitizeForResponse(),
        message: 'Token refreshed successfully',
        expiresIn: this.config.jwt.accessTokenExpiry
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('Token refresh error:', error);
      throw new AuthError(
        'Failed to refresh token',
        AuthErrorCodes.INTERNAL_ERROR,
        500
      );
    }
  }

  async logout(refreshToken: string, userId: string): Promise<{ success: boolean; message: string }> {
    await dbConnect();

    try {
      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: hashedRefreshToken }
      });

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      console.error('Logout error:', error);
      throw new AuthError(
        'Failed to logout',
        AuthErrorCodes.INTERNAL_ERROR,
        500
      );
    }
  }

  async validateSession(token: string): Promise<{ valid: boolean; user?: AuthUser }> {
    try {
      const decoded = await this.verifyAccessToken(token);
      
      await dbConnect();
      const user = await User.findById(decoded.id).select('-password -refreshTokens');
      
      if (!user || !user.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        user: user.sanitizeForResponse()
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

export const authService = new AuthService();