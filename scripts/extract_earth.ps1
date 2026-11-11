Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Naresh S\.gemini\antigravity\brain\4dcbec07-0d3d-4498-bdf5-bfa91e15449b\.user_uploaded\media_1794116255722_3a1d8df6.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $bmp.Width
$h = $bmp.Height
Write-Host "Width=$w, Height=$h"

# The right half starts at width/2
$rightX = [int]($w / 2)
$rightW = $w - $rightX

# We want the Earth at the bottom of the right half
$earthH = [int]($h * 0.6)
$earthY = $h - $earthH

$earthBmp = New-Object System.Drawing.Bitmap($rightW, $earthH)
$g = [System.Drawing.Graphics]::FromImage($earthBmp)
$srcRect = New-Object System.Drawing.Rectangle($rightX, $earthY, $rightW, $earthH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $rightW, $earthH)
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$dest1 = "frontend\img\earth_night.jpg"
$dest2 = "public\img\earth_night.jpg"
$earthBmp.Save($dest1, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$earthBmp.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$earthBmp.Dispose()
$bmp.Dispose()

Write-Host "Earth night image extracted successfully to $dest1 and $dest2!"

