import { existsSync } from 'fs'

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function extractPersonalInfo(rawText) {
  if (!rawText) return {}
  const info = {}

  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/)
  info.email = emailMatch ? emailMatch[0] : ''

  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  info.phone = phoneMatch ? phoneMatch[0].trim() : ''

  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w-]+/i)
  info.linkedin = linkedinMatch ? linkedinMatch[0] : ''

  const githubMatch = rawText.match(/github\.com\/[\w-]+/i)
  info.github = githubMatch ? githubMatch[0] : ''

  const locationMatch = rawText.match(/(?:Ahmedabad|Bangalore|Bengaluru|Mumbai|Delhi|Pune|Hyderabad|Chennai|Kolkata|Vadodara|Vapi|Remote|[\w\s]+,\s*(?:India|USA|UK|Canada|Remote))/i)
  info.location = locationMatch ? locationMatch[0] : ''

  const nameMatch = rawText.match(/^([A-Z][A-Z\s]+?)(?:\s+(?:Full|Senior|Junior|Software|Frontend|Backend|DevOps|Data|Cloud|System|Network|Mobile|UI\/UX|Product|Project|Technical|Lead|Principal|Staff|Engineer|Developer|Architect|Manager|Designer|Analyst|Consultant|Specialist|Intern))/i)
  if (nameMatch) {
    info.name = nameMatch[1].trim()
  } else {
    const firstLine = rawText.split('\n')[0] || ''
    const words = firstLine.split(/\s+/).slice(0, 2)
    info.name = words.join(' ')
  }

  const titleMatch = rawText.match(/(Full Stack|Senior|Junior|Software|Frontend|Backend|DevOps|Data|Cloud|System|Network|Mobile|UI\/UX|Product|Project|Technical|Lead|Principal|Staff)\s+(?:Software\s+)?(?:Engineer|Developer|Architect|Manager|Designer|Analyst|Consultant|Specialist|Intern)/i)
  info.title = titleMatch ? titleMatch[0] : 'Software Engineer'

  return info
}

function buildSectionHeading(title) {
  return `
    <div style="margin-top:18px;margin-bottom:8px;padding-bottom:4px;border-bottom:1.5px solid #374151;">
      <span style="font-family:'Calibri',Arial,sans-serif;font-size:11pt;font-weight:700;color:#111827;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(title)}</span>
    </div>`
}

function buildEntryHtml(entry) {
  const lines = entry.split('\n').filter(Boolean)
  if (!lines.length) return ''

  const firstLine = lines[0]
  const bullets = lines.slice(1)

  const dateMatch = firstLine.match(/(\w+\s+\d{4}\s*[-–]\s*(?:Present|\w+\s+\d{4}|\d{4}))/i)
  let dateText = ''
  let roleText = firstLine
  if (dateMatch) {
    dateText = dateMatch[0]
    roleText = firstLine.replace(dateMatch[0], '').replace(/[-–]\s*$/, '').trim()
    roleText = roleText.replace(/\s*\|\s*$/, '').trim()
  }

  const parts = roleText.split('|').map(s => s.trim()).filter(Boolean)
  const mainPart = parts[0] || roleText
  const subParts = parts.slice(1)

  let html = `<div style="margin-bottom:12px;">`
  html += `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">`
  html += `<span style="font-family:'Calibri',Arial,sans-serif;font-size:10.5pt;font-weight:600;color:#111827;">${escapeHtml(mainPart)}</span>`
  if (dateText) {
    html += `<span style="font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#6B7280;white-space:nowrap;margin-left:8px;">${escapeHtml(dateText)}</span>`
  }
  html += `</div>`
  if (subParts.length) {
    html += `<div style="font-family:'Calibri',Arial,sans-serif;font-size:9.5pt;color:#4B5563;margin-bottom:3px;">${subParts.map(p => escapeHtml(p)).join(' | ')}</div>`
  }

  const cleanBullets = bullets
    .map(b => b.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)

  if (cleanBullets.length) {
    html += `<ul style="margin:4px 0 0 0;padding:0 0 0 16px;">`
    cleanBullets.forEach(b => {
      html += `<li style="font-family:'Calibri',Arial,sans-serif;font-size:10pt;color:#374151;line-height:1.45;margin-bottom:3px;">${escapeHtml(b)}</li>`
    })
    html += `</ul>`
  }
  html += `</div>`
  return html
}

export function buildPdfHtml(content, rawText = '') {
  const info = extractPersonalInfo(rawText)
  const name = info.name || 'Professional Resume'
  const title = info.title || ''
  const email = info.email || ''
  const phone = info.phone || ''
  const location = info.location || ''
  const linkedin = info.linkedin || ''
  const github = info.github || ''

  const contactLine = [
    email ? `Email: ${escapeHtml(email)}` : '',
    phone ? `Phone: ${escapeHtml(phone)}` : '',
    location ? escapeHtml(location) : '',
  ].filter(Boolean).join('  &nbsp;|&nbsp; ')

  const socialLine = [
    linkedin ? escapeHtml(linkedin) : '',
    github ? escapeHtml(github) : '',
  ].filter(Boolean).join('  &nbsp;|&nbsp; ')

  const summary = content.summary || ''
  const skills = content.skills || ''
  const experience = content.experience || ''
  const projects = content.projects || ''
  const education = content.education || ''

  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean)
  const experienceEntries = experience.split(/\n\n(?=\S)/).filter(Boolean)
  const projectEntries = projects.split(/\n\n(?=\S)/).filter(Boolean)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0.5in 0.6in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #1F2937;
    background: white;
    padding: 0;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div style="text-align:center;margin-bottom:16px;">
  <div style="font-family:'Calibri',Arial,sans-serif;font-size:22pt;font-weight:700;color:#111827;letter-spacing:1px;margin-bottom:2px;">${escapeHtml(name)}</div>
  <div style="font-family:'Calibri',Arial,sans-serif;font-size:11pt;color:#4B5563;margin-bottom:6px;">${escapeHtml(title)}</div>
  <div style="font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#6B7280;">${contactLine}</div>
  ${socialLine ? `<div style="font-family:'Calibri',Arial,sans-serif;font-size:9pt;color:#6B7280;margin-top:2px;">${socialLine}</div>` : ''}
</div>

<!-- PROFESSIONAL SUMMARY -->
${summary ? `
${buildSectionHeading('Professional Summary')}
<div style="margin-bottom:14px;">
  <p style="font-family:'Calibri',Arial,sans-serif;font-size:10pt;color:#374151;line-height:1.5;">${escapeHtml(summary)}</p>
</div>` : ''}

<!-- EDUCATION -->
${education ? `
${buildSectionHeading('Education')}
<div style="margin-bottom:14px;">
  ${education.split('\n').filter(Boolean).map(line => `<p style="font-family:'Calibri',Arial,sans-serif;font-size:10pt;color:#374151;margin-bottom:3px;">${escapeHtml(line)}</p>`).join('')}
</div>` : ''}

<!-- TECHNICAL SKILLS -->
${skillList.length ? `
${buildSectionHeading('Technical Skills')}
<div style="margin-bottom:14px;">
  <ul style="margin:0;padding:0 0 0 16px;">
    ${skillList.map(s => `<li style="font-family:'Calibri',Arial,sans-serif;font-size:10pt;color:#374151;line-height:1.45;margin-bottom:2px;">${escapeHtml(s)}</li>`).join('')}
  </ul>
</div>` : ''}

<!-- EXPERIENCE -->
${experienceEntries.length ? `
${buildSectionHeading('Professional Experience')}
<div style="margin-bottom:14px;">
  ${experienceEntries.map(e => buildEntryHtml(e)).join('')}
</div>` : ''}

<!-- PROJECTS -->
${projectEntries.length ? `
${buildSectionHeading('Projects')}
<div style="margin-bottom:14px;">
  ${projectEntries.map(e => buildEntryHtml(e)).join('')}
</div>` : ''}

</body>
</html>`
}

export async function buildPdf(content, rawText = '') {
  const html = buildPdfHtml(content, rawText)
  let browser
  try {
    const { launch } = await import('puppeteer-core')
    const chromePath = findChromePath()
    if (!chromePath) {
      throw new Error('Chrome not found. Set CHROME_PATH in server/.env')
    }
    browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: chromePath,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.6in', right: '0.6in' },
    })
    return pdf
  } finally {
    if (browser) await browser.close()
  }
}

function findChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ]
  return paths.find(p => existsSync(p)) || null
}
