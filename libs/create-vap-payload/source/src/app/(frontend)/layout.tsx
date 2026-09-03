import type { Metadata } from 'next'
import React from 'react'

import './styles.css'

/**
 * The frontend shell — html, body and the stylesheet, and nothing else.
 *
 * No header or footer here on purpose. This scaffold declares no globals, so
 * there is nothing in the database for a shared header to read, and a chrome
 * hardcoded in the layout is one only a developer can change. The status page
 * owns its own furniture; when this site grows a real header, add it here and
 * give it a global to read from.
 *
 * Every route renders per request: content lives in Postgres, the site origin is
 * not build config, and the Docker image is built with no database at all.
 */
export const dynamic = 'force-dynamic'

const SITE_NAME = '__BRAND__'

export const metadata: Metadata = {
  // Next appends the site name to every page's own title through this template,
  // so a page sets only its half.
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
