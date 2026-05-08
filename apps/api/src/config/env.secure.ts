import { config } from "dotenv";
import { z } from "zod";
import crypto from "crypto";

// Load environment variables
config();
config({ path: "../../.env" });

/**
 * Security levels for environment variables
 */
export enum SecurityLevel {
  PUBLIC = "public",      // Can be exposed to client-side
  INTERNAL = "internal",  // Server-side only, not sensitive
  SECRET = "secret",      // Sensitive data (API keys, passwords)
  CRITICAL = "critical",  // Highly sensitive (encryption keys, JWT secrets)
}

/**
 * Environment variable metadata for security auditing
 */
interface EnvVarMetadata {
  name: string;
  description: string;
  securityLevel: SecurityLevel;
  required: boolean;
  defaultValue?: string;
  validation?: z.ZodTypeAny;
}

/**
 * Comprehensive environment schema with security metadata
 */
const envSchema = z.object({
  // Core application settings
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  
  // Security-critical secrets (CRITICAL level)
  JWT_SECRET: z.string().min(32).refine(
    (secret) => {
      // Require stronger secrets in production
      if (process.env.NODE_ENV === "production") {
        return secret.length >= 64 && /[A-Z]/.test(secret) && /[a-z]/.test(secret) && /[0-9]/.test(secret);
      }
      return true;
    },
    { message: "JWT_SECRET must be at least 64 characters with uppercase, lowercase, and numbers in production" }
  ),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // Database connections (SECRET level)
  MONGODB_URI: z.string().url().or(z.string().startsWith("mongodb://")),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  
  // External API keys (SECRET level)
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_CRICBUZZ_HOST: z.string().default("cricbuzz-cricket.p.rapidapi.com"),
  BETFAIR_APP_KEY: z.string().optional(),
  BETFAIR_SESSION_TOKEN: z.string().optional(),
  
  // Business configuration (INTERNAL level)
  COMMISSION_BPS: z.coerce.number().min(0).max(10000).default(200),
  MAX_USER_EXPOSURE: z.coerce.number().min(0).default(100000),
  MAX_MARKET_EXPOSURE: z.coerce.number().min(0).default(1000000),
  
  // Monitoring and logging (INTERNAL level)
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  SENTRY_DSN: z.string().url().optional(),
  
  // Rate limiting (INTERNAL level)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // CORS configuration (PUBLIC level)
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
});

/**
 * Environment variable metadata for security auditing
 */
export const envMetadata: EnvVarMetadata[] = [
  {
    name: "NODE_ENV",
    description: "Application environment (development, test, production)",
    securityLevel: SecurityLevel.PUBLIC,
    required: false,
    defaultValue: "development"
  },
  {
    name: "JWT_SECRET",
    description: "Secret key for signing JWT tokens",
    securityLevel: SecurityLevel.CRITICAL,
    required: true
  },
  {
    name: "MONGODB_URI",
    description: "MongoDB connection string",
    securityLevel: SecurityLevel.SECRET,
    required: true
  },
  {
    name: "REDIS_URL",
    description: "Redis connection URL",
    securityLevel: SecurityLevel.SECRET,
    required: false,
    defaultValue: "redis://localhost:6379"
  },
  {
    name: "RAPIDAPI_KEY",
    description: "RapidAPI key for cricket data",
    securityLevel: SecurityLevel.SECRET,
    required: false
  },
  {
    name: "BETFAIR_APP_KEY",
    description: "Betfair application key",
    securityLevel: SecurityLevel.SECRET,
    required: false
  }
];

/**
 * Validate environment variables with security checks
 */
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional security checks based on environment
    if (env.NODE_ENV === "production") {
      performProductionSecurityChecks(env);
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      console.error("❌ Environment validation failed:");
      console.error("Missing or invalid variables:", missingVars);
      console.error("\nPlease check your .env file against .env.example");
      
      // Provide helpful suggestions
      if (missingVars.includes("JWT_SECRET")) {
        console.error("\n💡 Generate a secure JWT secret:");
        console.error("   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
      }
    }
    throw error;
  }
}

/**
 * Perform additional security checks for production
 */
function performProductionSecurityChecks(env: z.infer<typeof envSchema>) {
  const warnings: string[] = [];
  
  // Check for weak JWT secret in production
  if (env.JWT_SECRET.length < 64) {
    warnings.push("JWT_SECRET is less than 64 characters - consider using a stronger secret");
  }
  
  // Check for default values in production
  if (env.JWT_SECRET.includes("development") || env.JWT_SECRET.includes("local")) {
    warnings.push("JWT_SECRET appears to contain development keywords - generate a production secret");
  }
  
  // Check MongoDB connection string
  if (env.MONGODB_URI.includes("localhost") || env.MONGODB_URI.includes("127.0.0.1")) {
    warnings.push("MongoDB URI points to localhost - ensure this is correct for production");
  }
  
  // Check Redis connection string
  if (env.REDIS_URL.includes("localhost") || env.REDIS_URL.includes("127.0.0.1")) {
    warnings.push("Redis URL points to localhost - ensure this is correct for production");
  }
  
  if (warnings.length > 0) {
    console.warn("⚠️  Production environment warnings:");
    warnings.forEach(warning => console.warn(`   • ${warning}`));
  }
}

/**
 * Generate a secure random string for environment variables
 */
export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Mask sensitive values in logs
 */
export function maskSensitiveValue(value: string, securityLevel: SecurityLevel): string {
  if (securityLevel === SecurityLevel.PUBLIC || securityLevel === SecurityLevel.INTERNAL) {
    return value;
  }
  
  if (value.length <= 8) {
    return "***";
  }
  
  const visibleChars = Math.min(4, Math.floor(value.length * 0.1));
  const maskedLength = value.length - (visibleChars * 2);
  const masked = "*".repeat(maskedLength);
  
  return `${value.substring(0, visibleChars)}${masked}${value.substring(value.length - visibleChars)}`;
}

/**
 * Get environment variable with security masking for logging
 */
export function getEnvWithMasking(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  
  const metadata = envMetadata.find(m => m.name === name);
  const securityLevel = metadata?.securityLevel || SecurityLevel.INTERNAL;
  
  return maskSensitiveValue(value, securityLevel);
}

// Export validated environment
export const env = validateEnvironment();

// Type for TypeScript usage
export type Env = z.infer<typeof envSchema>;