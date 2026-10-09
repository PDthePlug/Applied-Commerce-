export function friendlyAuthError(error: unknown, fallback = "We couldn’t complete that request. Please check your details and try again.") {
  const message = (error instanceof Error ? error.message : typeof error === "string" ? error : "").toLowerCase();
  if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
    return "The email or password doesn’t match our records. Please try again.";
  }
  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (message.includes("already registered") || message.includes("user already exists")) {
    return "An account already exists for this email. Try signing in instead.";
  }
  if (message.includes("weak password") || message.includes("password should be") || message.includes("password is too short")) {
    return "Choose a stronger password and try again.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts were made. Please wait a moment and try again.";
  }
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("fetch failed")) {
    return "There may be a connection issue. Check your internet connection and try again.";
  }
  return fallback;
}

export function friendlyActionError(error: unknown, fallback = "We couldn’t complete that change. Please review the details and try again.") {
  const message = (error instanceof Error ? error.message : typeof error === "string" ? error : "").toLowerCase();
  if (message.includes("permission denied") || message.includes("row-level security") || message.includes("not authorized") || message.includes("insufficient privilege")) {
    return "This account doesn’t have permission to make that change.";
  }
  if (message.includes("duplicate key") || message.includes("already exists") || message.includes("unique constraint")) {
    return "That record already exists. Check the details and try again.";
  }
  if (message.includes("invalid input") || message.includes("check constraint") || message.includes("violates check")) {
    return "Some details need attention. Review the form and try again.";
  }
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("fetch failed")) {
    return "There may be a connection issue. Check your internet connection and try again.";
  }
  return fallback;
}
