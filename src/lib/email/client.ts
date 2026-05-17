import { Resend } from "resend"
import { env } from "@/lib/env"

type SendArgs = {
	to: string
	subject: string
	html: string
	text?: string
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
	if (!resend) {
		console.log(`[email/dev] → ${to} · ${subject}\n${text ?? html}`)
		return
	}
	const { error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject,
		html,
		text,
	})
	if (error) {
		throw new Error(`Resend send failed: ${error.message}`)
	}
}
