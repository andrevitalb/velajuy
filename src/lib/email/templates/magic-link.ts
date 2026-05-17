export function magicLinkEmail({ url, email }: { url: string; email: string }) {
	const subject = "Tu enlace para entrar a Velajuy"
	const text = `Hola ${email},\n\nUsa este enlace para entrar a Velajuy:\n${url}\n\nEl enlace expira pronto. Si no fuiste tú, ignora este correo.\n\n— Velajuy`
	const html = `
		<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #5c1a2a;">
			<h1 style="margin: 0 0 16px; font-size: 24px;">Hola 👋</h1>
			<p style="margin: 0 0 24px; line-height: 1.5;">Haz clic en el botón para entrar a tu cuenta de Velajuy.</p>
			<p style="margin: 0 0 32px;">
				<a href="${url}" style="display: inline-block; background: #5c1a2a; color: #fff; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">Entrar a Velajuy</a>
			</p>
			<p style="margin: 0 0 8px; color: #7a3d4d; font-size: 14px;">O copia este enlace en tu navegador:</p>
			<p style="margin: 0; word-break: break-all; color: #7a3d4d; font-size: 13px;">${url}</p>
			<hr style="margin: 32px 0; border: none; border-top: 1px solid #f4b6c2;" />
			<p style="margin: 0; color: #7a3d4d; font-size: 12px;">Si no fuiste tú, ignora este correo. El enlace expira pronto.</p>
		</div>
	`
	return { subject, text, html }
}
