import { Suspense } from "react"
import { IngresarForm } from "./ingresar-form"

export default function IngresarPage() {
	return (
		<Suspense fallback={null}>
			<IngresarForm />
		</Suspense>
	)
}
