Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Draw-Icon {
  param(
    [int]$Size,
    [string]$OutputPath
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $bgPath = New-RoundedRectPath -X 0 -Y 0 -Width ($Size - 1) -Height ($Size - 1) -Radius ($Size * 0.22)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF 0, 0, $Size, $Size),
    [System.Drawing.ColorTranslator]::FromHtml('#1A3C5A'),
    [System.Drawing.ColorTranslator]::FromHtml('#0E2235'),
    90
  )
  $graphics.FillPath($bgBrush, $bgPath)

  $borderPen = New-Object System.Drawing.Pen(
    [System.Drawing.ColorTranslator]::FromHtml('#E0A458'),
    [Math]::Max(1, $Size * 0.055)
  )
  $borderPen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Inset
  $graphics.DrawPath($borderPen, $bgPath)

  $shineBrush = New-Object System.Drawing.SolidBrush(
    [System.Drawing.Color]::FromArgb(28, 255, 255, 255)
  )
  $shinePath = New-RoundedRectPath -X ($Size * 0.11) -Y ($Size * 0.10) -Width ($Size * 0.78) -Height ($Size * 0.28) -Radius ($Size * 0.14)
  $graphics.FillPath($shineBrush, $shinePath)

  $nPen = New-Object System.Drawing.Pen(
    [System.Drawing.ColorTranslator]::FromHtml('#F7F1E3'),
    [Math]::Max(2, $Size * 0.17)
  )
  $nPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $nPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $nPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $graphics.DrawLine($nPen, $Size * 0.29, $Size * 0.28, $Size * 0.29, $Size * 0.73)
  $graphics.DrawLine($nPen, $Size * 0.29, $Size * 0.28, $Size * 0.71, $Size * 0.72)
  $graphics.DrawLine($nPen, $Size * 0.71, $Size * 0.28, $Size * 0.71, $Size * 0.72)

  $accentBrush = New-Object System.Drawing.SolidBrush(
    [System.Drawing.ColorTranslator]::FromHtml('#E06C4F')
  )
  $accentSize = $Size * 0.16
  $graphics.FillEllipse($accentBrush, $Size * 0.69, $Size * 0.14, $accentSize, $accentSize)

  $tailPoints = @(
    (New-Object System.Drawing.PointF ($Size * 0.74), ($Size * 0.86)),
    (New-Object System.Drawing.PointF ($Size * 0.88), ($Size * 0.78)),
    (New-Object System.Drawing.PointF ($Size * 0.82), ($Size * 0.93))
  )
  $graphics.FillPolygon($accentBrush, $tailPoints)

  $directory = Split-Path -Parent $OutputPath
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $accentBrush.Dispose()
  $nPen.Dispose()
  $shineBrush.Dispose()
  $shinePath.Dispose()
  $borderPen.Dispose()
  $bgBrush.Dispose()
  $bgPath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$sizes = 16, 32, 48, 96, 128

foreach ($size in $sizes) {
  $output = Join-Path $PSScriptRoot "..\\public\\icon\\$size.png"
  Draw-Icon -Size $size -OutputPath $output
}

