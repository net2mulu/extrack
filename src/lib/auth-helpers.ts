"use server";

import { auth } from "@/auth";

/**
 * Get the current authenticated user ID from the session
 * Throws an error if user is not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      const error = new Error("User not authenticated");
      error.name = "UnauthenticatedError";
      throw error;
    }
    
    return session.user.id;
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error?.name === "UnauthenticatedError") {
      throw error;
    }
    // Log the actual error for debugging
    console.error("Error in getCurrentUserId - auth() call failed:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    // Throw a generic authentication error
    const authError = new Error("User not authenticated");
    authError.name = "UnauthenticatedError";
    throw authError;
  }
}

