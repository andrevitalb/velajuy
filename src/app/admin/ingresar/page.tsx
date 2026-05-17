import { Suspense } from "react"
import { AdminIngresarForm } from "./admin-ingresar-form"

export default function AdminIngresarPage() {
	return (
		<Suspense fallback={null}>
			<AdminIngresarForm />
		</Suspense>
	)
}
