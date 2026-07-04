import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopType, TabStopPosition,
} from 'docx'

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
    info.name = firstLine.split(/\s+/).slice(0, 2).join(' ')
  }

  const titleMatch = rawText.match(/(Full Stack|Senior|Junior|Software|Frontend|Backend|DevOps|Data|Cloud|System|Network|Mobile|UI\/UX|Product|Project|Technical|Lead|Principal|Staff)\s+(?:Software\s+)?(?:Engineer|Developer|Architect|Manager|Designer|Analyst|Consultant|Specialist|Intern)/i)
  info.title = titleMatch ? titleMatch[0] : 'Software Engineer'

  return info
}

function parseEntries(text) {
  if (!text) return []
  return text.split(/\n\n(?=\S)/).filter(Boolean).map(block => {
    const lines = block.split('\n').filter(Boolean)
    return { firstLine: lines[0] || '', bullets: lines.slice(1) }
  })
}

function sectionHeading(title) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '374151' } },
  })
}

function buildEntryParagraphs(entry) {
  const { firstLine, bullets } = entry
  const children = []

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

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: mainPart, size: 21, bold: true, color: '111827' }),
        ...(dateText ? [new TextRun({ text: `\t${dateText}`, size: 18, color: '6B7280' })] : []),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    })
  )

  if (subParts.length) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: subParts.join(' | '), size: 19, italics: true, color: '4B5563' }),
        ],
      })
    )
  }

  const cleanBullets = bullets
    .map(b => b.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)

  cleanBullets.forEach(b => {
    children.push(
      new Paragraph({
        spacing: { after: 30 },
        indent: { left: 288 },
        children: [
          new TextRun({ text: '\u2022  ', size: 20, color: '374151' }),
          new TextRun({ text: b, size: 20, color: '374151' }),
        ],
      })
    )
  })

  return children
}

export function buildDocx(content, rawText = '') {
  const info = extractPersonalInfo(rawText)
  const name = info.name || 'Professional Resume'
  const title = info.title || ''
  const email = info.email || ''
  const phone = info.phone || ''
  const location = info.location || ''
  const linkedin = info.linkedin || ''
  const github = info.github || ''

  const summary = content.summary || ''
  const skills = content.skills || ''
  const experience = content.experience || ''
  const projects = content.projects || ''
  const education = content.education || ''

  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean)
  const experienceEntries = parseEntries(experience)
  const projectEntries = parseEntries(projects)

  const children = []

  // ── HEADER ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: name, size: 32, bold: true, color: '111827' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: title, size: 22, color: '4B5563' })],
    })
  )

  const contactParts = [
    email ? `Email: ${email}` : '',
    phone ? `Phone: ${phone}` : '',
    location,
  ].filter(Boolean)
  if (contactParts.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: contactParts.join('  |  '), size: 18, color: '6B7280' })],
      })
    )
  }

  const socialParts = [linkedin, github].filter(Boolean)
  if (socialParts.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: socialParts.join('  |  '), size: 18, color: '6B7280' })],
      })
    )
  }

  // ── PROFESSIONAL SUMMARY ──
  if (summary) {
    children.push(sectionHeading('Professional Summary'))
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: summary, size: 20, color: '374151' })],
      })
    )
  }

  // ── EDUCATION ──
  if (education) {
    children.push(sectionHeading('Education'))
    education.split('\n').filter(Boolean).forEach(line => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: line, size: 20, color: '374151' })],
        })
      )
    })
  }

  // ── TECHNICAL SKILLS ──
  if (skillList.length) {
    children.push(sectionHeading('Technical Skills'))
    skillList.forEach(skill => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 288 },
          children: [
            new TextRun({ text: '\u2022  ', size: 20, color: '374151' }),
            new TextRun({ text: skill, size: 20, color: '374151' }),
          ],
        })
      )
    })
  }

  // ── PROFESSIONAL EXPERIENCE ──
  if (experienceEntries.length) {
    children.push(sectionHeading('Professional Experience'))
    experienceEntries.forEach((entry, i) => {
      if (i > 0) {
        children.push(new Paragraph({ spacing: { before: 160 } }))
      }
      children.push(...buildEntryParagraphs(entry))
    })
  }

  // ── PROJECTS ──
  if (projectEntries.length) {
    children.push(sectionHeading('Projects'))
    projectEntries.forEach((entry, i) => {
      if (i > 0) {
        children.push(new Paragraph({ spacing: { before: 160 } }))
      }
      children.push(...buildEntryParagraphs(entry))
    })
  }

  const doc = new Document({
    title: 'Resume',
    description: 'Professional resume',
    styles: {
      default: {
        document: {
          run: { size: 20, font: 'Calibri', color: '1F2937' },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{ children }],
  })

  return Packer.toBuffer(doc)
}
