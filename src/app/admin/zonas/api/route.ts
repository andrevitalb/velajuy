import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/auth-guards"
import { listZones } from "@/lib/admin/zones/queries"

export async function GET() {
	await requireOwner()
	const rows = await listZones()
	return NextResponse.json(rows)
}
