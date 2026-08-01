import NextAuth from "next-auth"
import { authConfig } from "./src/auth.config"

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/profile/:path*", "/orders/:path*", "/quotes/:path*", "/client/:path*"],
}
