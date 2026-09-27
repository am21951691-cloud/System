/**
 * Microsoft Office XML Spreadsheet (SpreadsheetML 2003) Generator
 * Generates beautifully styled, native RTL Excel files (.xls) without any external dependencies.
 * 100% compatible with Cloudflare Workers / Edge Runtime.
 */

export interface ExcelColumn {
  width?: number // in points (e.g., 100, 150)
}

export interface ExcelCell {
  value: string | number | null | undefined
  styleId?: string
  type?: 'String' | 'Number'
  mergeAcross?: number
  mergeDown?: number
}

export interface ExcelRow {
  height?: number
  cells: ExcelCell[]
}

export interface ExcelWorksheet {
  name: string
  columns?: ExcelColumn[]
  rows: ExcelRow[]
  freezeRows?: number
}

export function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSpreadsheetML(worksheets: ExcelWorksheet[]): string {
  const xmlParts: string[] = []

  xmlParts.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  xmlParts.push(`<?mso-application progid="Excel.Sheet"?>`)
  xmlParts.push(
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"` +
      ` xmlns:o="urn:schemas-microsoft-com:office:office"` +
      ` xmlns:x="urn:schemas-microsoft-com:office:excel"` +
      ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"` +
      ` xmlns:html="http://www.w3.org/TR/REC-html40">`
  )

  // Document Properties
  xmlParts.push(` <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">`)
  xmlParts.push(`  <Author>نظام إدارة الجمعية الطبية</Author>`)
  xmlParts.push(`  <Company>الجمعية الخيرية للرعاية الطبية</Company>`)
  xmlParts.push(`  <Created>${new Date().toISOString()}</Created>`)
  xmlParts.push(` </DocumentProperties>`)

  // Styles Definition
  xmlParts.push(` <Styles>`)

  // Default Style
  xmlParts.push(`  <Style ss:ID="Default" ss:Name="Normal">`)
  xmlParts.push(`   <Alignment ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders/>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="10" ss:Color="#0F172A"/>`)
  xmlParts.push(`   <Interior/>`)
  xmlParts.push(`   <NumberFormat/>`)
  xmlParts.push(`   <Protection/>`)
  xmlParts.push(`  </Style>`)

  // Main Document Title (Large Banner)
  xmlParts.push(`  <Style ss:ID="MainTitle">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E3A8A"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="14" ss:Color="#FFFFFF" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Subtitle / Metadata Row
  xmlParts.push(`  <Style ss:ID="SubTitle">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#475569" ss:Italic="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Standard Table Header (Dark Slate/Blue)
  xmlParts.push(`  <Style ss:ID="Header">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="10.5" ss:Color="#FFFFFF" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#1E40AF" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Green Table Header (e.g. for approved/dispensed)
  xmlParts.push(`  <Style ss:ID="HeaderGreen">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#14532D"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="10.5" ss:Color="#FFFFFF" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#15803D" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Standard Data Cells (Center)
  xmlParts.push(`  <Style ss:ID="DataCenter">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#0F172A"/>`)
  xmlParts.push(`  </Style>`)

  // Alternate Row Data Cells (Center)
  xmlParts.push(`  <Style ss:ID="DataCenterAlt">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#0F172A"/>`)
  xmlParts.push(`   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Standard Data Cells (Right Aligned for long text/descriptions)
  xmlParts.push(`  <Style ss:ID="DataRight">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#0F172A"/>`)
  xmlParts.push(`  </Style>`)

  // Alternate Row Data Cells (Right Aligned)
  xmlParts.push(`  <Style ss:ID="DataRightAlt">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#0F172A"/>`)
  xmlParts.push(`   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Highlight Patient ID / Code
  xmlParts.push(`  <Style ss:ID="IdCell">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="10" ss:Color="#1D4ED8" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // Date and Time Style
  xmlParts.push(`  <Style ss:ID="DateCell">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9" ss:Color="#64748B"/>`)
  xmlParts.push(`  </Style>`)

  // Badges & Statuses
  // 1. Approved / Green Badge
  xmlParts.push(`  <Style ss:ID="BadgeApproved">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#166534" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // 2. Rejected / Red Badge
  xmlParts.push(`  <Style ss:ID="BadgeRejected">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#991B1B" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // 3. Pending / Yellow Badge
  xmlParts.push(`  <Style ss:ID="BadgeWarning">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCD34D"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCD34D"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCD34D"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCD34D"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#92400E" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // 4. Doctor Review / Blue Badge
  xmlParts.push(`  <Style ss:ID="BadgeInfo">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7DD3FC"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7DD3FC"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7DD3FC"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7DD3FC"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9.5" ss:Color="#0369A1" ss:Bold="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  // 5. Redacted / Confidential Badge
  xmlParts.push(`  <Style ss:ID="RedactedCell">`)
  xmlParts.push(`   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>`)
  xmlParts.push(`   <Borders>`)
  xmlParts.push(`    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>`)
  xmlParts.push(`    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>`)
  xmlParts.push(`    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>`)
  xmlParts.push(`    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>`)
  xmlParts.push(`   </Borders>`)
  xmlParts.push(`   <Font ss:FontName="Segoe UI, Tahoma, Arial" x:CharSet="1" ss:Size="9" ss:Color="#64748B" ss:Italic="1"/>`)
  xmlParts.push(`   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>`)
  xmlParts.push(`  </Style>`)

  xmlParts.push(` </Styles>`)

  // Worksheets Generation
  for (const sheet of worksheets) {
    xmlParts.push(` <Worksheet ss:Name="${escapeXml(sheet.name)}">`)
    xmlParts.push(`  <Table ss:DefaultRowHeight="24">`)

    // Columns specification
    if (sheet.columns && sheet.columns.length > 0) {
      for (const col of sheet.columns) {
        xmlParts.push(`   <Column ss:Width="${col.width || 100}"/>`)
      }
    }

    // Rows
    for (const row of sheet.rows) {
      const heightAttr = row.height ? ` ss:Height="${row.height}"` : ''
      xmlParts.push(`   <Row${heightAttr}>`)

      for (const cell of row.cells) {
        const styleAttr = cell.styleId ? ` ss:StyleID="${cell.styleId}"` : ''
        const mergeAcrossAttr = cell.mergeAcross ? ` ss:MergeAcross="${cell.mergeAcross}"` : ''
        const mergeDownAttr = cell.mergeDown ? ` ss:MergeDown="${cell.mergeDown}"` : ''
        const dataType = cell.type || (typeof cell.value === 'number' ? 'Number' : 'String')
        const escapedVal = escapeXml(cell.value)

        xmlParts.push(
          `    <Cell${styleAttr}${mergeAcrossAttr}${mergeDownAttr}><Data ss:Type="${dataType}">${escapedVal}</Data></Cell>`
        )
      }

      xmlParts.push(`   </Row>`)
    }

    xmlParts.push(`  </Table>`)

    // Worksheet Options: Native Right-To-Left + Frozen Header Panes
    xmlParts.push(`  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">`)
    xmlParts.push(`   <DisplayRightToLeft/>`)
    if (sheet.freezeRows && sheet.freezeRows > 0) {
      xmlParts.push(`   <FreezePanes/>`)
      xmlParts.push(`   <FrozenNoSplit/>`)
      xmlParts.push(`   <SplitHorizontal>${sheet.freezeRows}</SplitHorizontal>`)
      xmlParts.push(`   <TopRowBottomPane>${sheet.freezeRows}</TopRowBottomPane>`)
      xmlParts.push(`   <ActivePane>2</ActivePane>`)
    }
    xmlParts.push(`   <ProtectObjects>False</ProtectObjects>`)
    xmlParts.push(`   <ProtectScenarios>False</ProtectScenarios>`)
    xmlParts.push(`  </WorksheetOptions>`)
    xmlParts.push(` </Worksheet>`)
  }

  xmlParts.push(`</Workbook>`)

  return xmlParts.join('\n')
}
