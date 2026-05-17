import { PageHeader } from "@/components/admin/page-header"
import { PageForm } from "../page-form"

export default function NewPagePage() {
	return (
		<>
			<PageHeader title="Nueva página" />
			<PageForm
				mode="create"
				defaults={{ slug: "", title: "", body: "", metaDescription: null, published: false }}
			/>
		</>
	)
}
