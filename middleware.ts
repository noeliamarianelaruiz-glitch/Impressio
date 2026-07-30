export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/profile/:path*", "/orders/:path*", "/quotes/:path*", "/client/:path*"],
}