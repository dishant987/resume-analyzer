import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, WidthType,
} from 'docx'

export function buildDocx(content) {
  const sections = [
    {
      children: [
        new Paragraph({
          text: content.summary || '',
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: content.summary, size: 22, color: '4B5563' }),
          ],
        }),
      ],
    },
  ]

  const sectionMap = [
    { key: 'experience', title: 'Experience' },
    { key: 'projects', title: 'Projects' },
    { key: 'skills', title: 'Skills' },
    { key: 'education', title: 'Education' },
  ]

  for (const sec of sectionMap) {
    const text = content[sec.key]
    if (!text) continue
    const children = [
      new Paragraph({
        text: sec.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
      }),
    ]
    const lines = text.split('\n').filter(Boolean)
    for (const line of lines) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: line, size: 22 })],
        })
      )
    }
    sections.push({ children })
  }

  const doc = new Document({
    title: 'Resume',
    description: 'AI-improved resume',
    styles: { default: { document: { run: { size: 22, font: 'Calibri' } } } },
    sections,
  })

  return Packer.toBuffer(doc)
}

export function buildHtml(content) {
  const sectionHtml = (title, text) => {
    if (!text) return ''
    const lines = text.split('\n').filter(Boolean).map((l) => `<p>${escapeHtml(l)}</p>`).join('')
    return `
      <div class="section">
        <h2>${escapeHtml(title)}</h2>
        ${lines}
      </div>
    `
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 0.75in 1in; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1F2937; padding: 0; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 18pt; font-weight: 700; margin-bottom: 4px; }
    .header p { font-size: 10pt; color: #6B7280; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13pt; font-weight: 600; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin-bottom: 8px; color: #111827; }
    .section p { margin-bottom: 6px; }
    .skills { display: flex; flex-wrap: wrap; gap: 4px; }
    .skills span { background: #F3F4F6; padding: 2px 8px; border-radius: 4px; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="header">
    <p>Professional Resume</p>
  </div>
  ${content.summary ? `<div class="section"><p style="text-align:center;color:#4B5563;">${escapeHtml(content.summary)}</p></div>` : ''}
  ${sectionHtml('Experience', content.experience)}
  ${sectionHtml('Projects', content.projects)}
  ${sectionHtml('Skills', content.skills)}
  ${sectionHtml('Education', content.education)}
</body>
</html>`
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function buildPdf(content) {
  const html = buildHtml(content)
  let browser
  try {
    const { launch } = await import('puppeteer-core')
    browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_PATH || undefined,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', margin: { top: '0.75in', bottom: '0.75in', left: '1in', right: '1in' } })
    return pdf
  } finally {
    if (browser) await browser.close()
  }
}
