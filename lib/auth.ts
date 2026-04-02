import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { Resend } from 'resend'
import { db } from './db'
import * as schema from './db/schema'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  appName: 'School ERP System',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: aktifkan sebelum production (butuh domain terverifikasi di Resend)
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async (data) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@school-erp.id',
        to: data.user.email,
        subject: 'Verifikasi Email Anda — School ERP System',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verifikasi Alamat Email Anda</h2>
            <p>Halo <strong>${data.user.name}</strong>,</p>
            <p>Terima kasih telah mendaftar di School ERP System. Klik tombol di bawah untuk memverifikasi email Anda.</p>
            <a
              href="${data.url}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 16px 0;
              "
            >
              Verifikasi Email
            </a>
            <p>Atau salin tautan berikut ke browser Anda:</p>
            <p style="word-break: break-all; color: #6b7280;">${data.url}</p>
            <p style="color: #6b7280; font-size: 14px;">
              Tautan ini berlaku selama 1 jam. Jika Anda tidak mendaftar, abaikan email ini.
            </p>
          </div>
        `,
      })
    },
  },
  rateLimit: {
    window: 60,
    max: 5,
  },
  session: {
    expiresIn: 60 * 60 * 2, // 2 jam
  },
  user: {
    fields: {
      image: 'avatar',
    },
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'school',
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
