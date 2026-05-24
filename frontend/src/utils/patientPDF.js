import jsPDF from 'jspdf'

export async function exportPatientPDF(patient, medicalRecords = [], labOrders = []) {
  const doc = new jsPDF()
  const blue = [10, 61, 107]
  const lightBlue = [13, 95, 163]
  const gray = [107, 124, 147]
  const lightGray = [240, 244, 248]
  const dark = [26, 32, 44]

  // Header
  doc.setFillColor(...blue)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('MediCore', 20, 16)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestion Clinica', 20, 24)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-EC')}`, 190, 20, { align: 'right' })

  let y = 48

  // Titulo
  doc.setFontSize(16)
  doc.setTextColor(...blue)
  doc.setFont('helvetica', 'bold')
  doc.text('Historia Clinica del Paciente', 20, y)
  y += 12

  doc.setDrawColor(...lightBlue)
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)
  y += 8

  // Datos personales
  doc.setFontSize(12)
  doc.setTextColor(...blue)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos Personales', 20, y)
  y += 8

  const campos = [
    ['Nombre completo', `${patient.first_name} ${patient.last_name}`],
    ['Documento', `${patient.document_type?.toUpperCase() || 'CI'}: ${patient.document_number}`],
    ['Fecha de nacimiento', patient.date_of_birth || 'No registrada'],
    ['Genero', patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'No registrado'],
    ['Tipo de sangre', patient.blood_type || 'No registrado'],
    ['Telefono', patient.phone || 'No registrado'],
    ['Email', patient.email || 'No registrado'],
    ['Ciudad', patient.city || 'No registrada'],
  ]

  const boxHeight = Math.ceil(campos.length / 2) * 14 + 10
  doc.setFillColor(...lightGray)
  doc.roundedRect(20, y, 170, boxHeight, 3, 3, 'F')
  y += 8

  let col = 0
  campos.forEach(([label, value]) => {
    const x = col === 0 ? 25 : 110
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.setFont('helvetica', 'normal')
    doc.text(label.toUpperCase(), x, y)
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), x, y + 5)
    col++
    if (col === 2) { col = 0; y += 14 }
  })
  y += 10

  if (patient.allergies) {
    doc.setFillColor(254, 226, 226)
    doc.roundedRect(20, y, 170, 14, 3, 3, 'F')
    doc.setFontSize(8)
    doc.setTextColor(185, 28, 28)
    doc.setFont('helvetica', 'bold')
    doc.text('ALERGIAS:', 25, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.text(patient.allergies, 55, y + 9)
    y += 20
  }

  // Historia Clinica
  if (y > 230) { doc.addPage(); y = 20 }
  doc.setFontSize(12)
  doc.setTextColor(...blue)
  doc.setFont('helvetica', 'bold')
  doc.text(`Historia Clinica (${medicalRecords.length} consultas)`, 20, y)
  y += 4
  doc.setDrawColor(...lightBlue)
  doc.line(20, y, 190, y)
  y += 8

  if (medicalRecords.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(...gray)
    doc.setFont('helvetica', 'italic')
    doc.text('Sin consultas registradas', 20, y)
    y += 12
  } else {
    medicalRecords.forEach((r, idx) => {
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFillColor(...lightGray)
      doc.roundedRect(20, y, 170, 8, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setTextColor(...blue)
      doc.setFont('helvetica', 'bold')
      doc.text(`Consulta ${idx + 1} — ${r.created_at ? new Date(r.created_at).toLocaleDateString('es-EC') : 'Sin fecha'}`, 24, y + 5.5)
      y += 12

      const filas = [
        ['Motivo de consulta', r.chief_complaint],
        ['Anamnesis', r.anamnesis],
        ['Examen fisico', r.physical_exam],
        ['Tratamiento', r.treatment],
        ['Notas', r.notes],
      ]

      filas.forEach(([label, val]) => {
        if (!val) return
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFontSize(8)
        doc.setTextColor(...gray)
        doc.setFont('helvetica', 'bold')
        doc.text(label.toUpperCase(), 24, y)
        y += 5
        doc.setFontSize(9)
        doc.setTextColor(...dark)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(String(val), 160)
        doc.text(lines, 24, y)
        y += lines.length * 5 + 3
      })

      if (r.diagnosis?.length > 0) {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFontSize(8)
        doc.setTextColor(...gray)
        doc.setFont('helvetica', 'bold')
        doc.text('DIAGNOSTICO', 24, y)
        y += 5
        r.diagnosis.forEach(d => {
          doc.setFontSize(9)
          doc.setTextColor(...dark)
          doc.setFont('helvetica', 'normal')
          doc.text(`• ${d.description || d.code || JSON.stringify(d)}`, 27, y)
          y += 5
        })
      }
      y += 4
    })
  }

  // Laboratorio
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFontSize(12)
  doc.setTextColor(...blue)
  doc.setFont('helvetica', 'bold')
  doc.text(`Examenes de Laboratorio (${labOrders.length} ordenes)`, 20, y)
  y += 4
  doc.setDrawColor(...lightBlue)
  doc.line(20, y, 190, y)
  y += 8

  if (labOrders.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(...gray)
    doc.setFont('helvetica', 'italic')
    doc.text('Sin ordenes de laboratorio', 20, y)
    y += 12
  } else {
    labOrders.forEach((o, idx) => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFillColor(...lightGray)
      doc.roundedRect(20, y, 170, 8, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setTextColor(...blue)
      doc.setFont('helvetica', 'bold')
      const statusLabel = { pending: 'Pendiente', processing: 'En proceso', completed: 'Completado', cancelled: 'Cancelado' }
      doc.text(`Orden ${idx + 1} — Estado: ${statusLabel[o.status] || o.status}`, 24, y + 5.5)
      y += 12

      if (o.tests) {
        doc.setFontSize(8)
        doc.setTextColor(...gray)
        doc.setFont('helvetica', 'bold')
        doc.text('EXAMENES SOLICITADOS', 24, y)
        y += 5
        doc.setFontSize(9)
        doc.setTextColor(...dark)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(o.tests, 160)
        doc.text(lines, 24, y)
        y += lines.length * 5 + 4
      }
    })
  }

  // Footer en cada página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.text(`MediCore — Historia Clinica: ${patient.first_name} ${patient.last_name}`, 20, 290)
    doc.text(`Pagina ${i} de ${pageCount}`, 190, 290, { align: 'right' })
  }

  doc.save(`historia_clinica_${patient.first_name}_${patient.last_name}.pdf`)
}
