import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  return NextResponse.next({ request: req });
}

export const config = {
  matcher: ["/", "/login"],
};
